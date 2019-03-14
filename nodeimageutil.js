
let child_process = require('child_process');
let path = require('path');
let fs = require('fs');

/**
 * ImageMagick 包的 convert 工具的路径
 */
let imageMagickConvertPath = "convert"
/**
 * ImageMagick 包的 identify 工具的路径
 */
let imageMagickIdentifyPath = "identify"

/**
 * PngquantPath pngquant命令行工具的路径
 */
let pngquantPath = "pngquant"
/**
 * 是否打印出调试信息
 */
let showDebug = false;
/**
 * 是否打印出错误信息
 */
let showError = false;

/**
 *  JPEG 图片格式JPEG
 */
const JPEG = "JPEG"

/**
 *  PNG 图片格式PNG
 */
const PNG = "PNG"

/**
 *  GIF 图片格式GIF
 */
const GIF = "GIF"

/**
 *  BMP 图片格式BMP
 */
const BMP = "BMP"

/**
 * 图片信息
 */
let ImageInfo = {
    /**
     * 是否是已知的图片格式
     */
    IsKnowImage: false,
    Width: 0,
    Height: 0,
    FileSize: 0,
    FilePath: "",
    Format: "",
}

/**
 * 处理选项
 */
let Option = {
    /**
     * 要缩放成的宽度，为0表示默认
     */
    Width: 0,
    /**
     * 要缩放成的高度，为0表示默认
     */
    Heigth: 0,
    /**
     * 不等于0时，表示要压缩，设置图片的质量参数，1-100。如果要压缩的是png格式，则这个值表示pngquant的质量参数的最大值
     */
    Quality: 0,
    /**
     * pngquant压缩png图片时，质量参数的最小值
     */
    PngQunlityMin: 0,
}

/**
 * 配置信息
 */
let Config = {
    /**
     * ImageMagick 包的 convert 工具的路径
     */
    ImageMagickConvertPath: "convert",
    /**
     * ImageMagick 包的 identify 工具的路径
     */
    ImageMagickIdentifyPath: "identify",
    /**
     * PngquantPath pngquant命令行工具的路径
     */
    PngquantPath: "pngquant",
    /**
     * 是否打印出调试信息
     */
    ShowDebug: false,
    /**
     * 是否打印出错误信息
     */
    ShowError: false,
}

/**
 * 进行初始化，检查各个命令是否可用。
 * @param {Config} conf 配置信息
 * @returns {*} 出错信息。如果返回null，则表示没有出错，可以使用。否则返回出错的信息。
 */
async function Init(conf) {
    try {
        await run(conf.ImageMagickConvertPath, "--version");
        await run(conf.ImageMagickIdentifyPath, "--version");
        await run(conf.PngquantPath, "--version");
        imageMagickConvertPath = conf.ImageMagickConvertPath;
        imageMagickIdentifyPath = conf.ImageMagickIdentifyPath;
        pngquantPath = conf.PngquantPath;
        showDebug = conf.ShowDebug;
        showError = conf.ShowError;
        if (showDebug) {
            console.info('ImageMagickConvertPath set to :', imageMagickConvertPath);
            console.info('ImageMagickIdentifyPath set to :', imageMagickIdentifyPath);
            console.info('PngquantPath set to :', pngquantPath);
            console.info('ShowError set to :', showError);
        }
    } catch (error) {
        return error;
    }
}

/**
 * 以指定的参数执行一个命令，返回一个Promise，在命令退出码为0时回调resolve，否则回调reject
 * @param {string} file 要执行的命令工具
 * @param  {...string} args 命令参数
 */
function run(file, ...args) {
    showDebug && console.debug(file, ...args);
    return new Promise((resolve, reject) => {
        let the_error = null, the_stdout = null, the_stderr = null, the_exit_code = null;
        let getOutput = false;
        let p = child_process.execFile(file, args, function (error, stdout, stderr) {
            the_error = error;
            the_stderr = stderr;
            the_stdout = stdout;
            getOutput = true;
            exit();
        });
        p.on('exit', function (code, signal) {
            the_exit_code = code;
            exit();
        });
        function exit() {
            if (the_error != null || (the_exit_code != null && getOutput)) {
                if (the_error == null && the_exit_code == 0) {
                    resolve(the_stdout)
                } else {
                    reject({ error: the_error, output: the_stderr })
                }
            }
        }
    });
}

/**
 * 获取图片文件的属性
 * @param {string} file 图片文件的绝对路径
 * @returns {ImageInfo} 图像属性
 */
async function Info(file) {
    let format = `{"w":%[w],"h":%[h],"m":"%[m]"}`;//,"size":%[B]    B=文件字节数，在7.0版本之前不支持
    try {
        let output = await run(imageMagickIdentifyPath, "-format", format, file);
        // showDebug && console.debug("get info output:", output);
        let js = JSON.parse(output);
        let stats = fs.statSync(file);
        /**
         * @type {ImageInfo}
         */
        let info = {
            IsKnowImage: true,
            Width: js.w,
            Height: js.h,
            FileSize: stats.size,
            FilePath: file,
            Format: js.m
        }
        return info;
    } catch (error) {
        showError && console.error("get info error:", error);
        let info = {
            IsKnowImage: false
        }
        return info;
    }
}

/**
 * 使用指定的参数转换一个图片文件
 * @param {string} fileIn 要处理的文件的绝对路径
 * @param {string} fileOut 要保存的文件的绝对路径
 * @param {Option} opt 处理的参数
 */
async function Convert(fileIn, fileOut, opt) {
    if (opt == null) {
        opt = {}
    }
    /**
     * @type {[string]}
     */
    let args = [];
    //处理过程中使用的临时文件
    let tempFile = fileIn;
    let outFormat = path.extname(fileOut).replace(".", "").toUpperCase();
    let info = await Info(fileIn);
    if (info.IsKnowImage == false) {
        throw new Error("UnknowImageFormat");
    }
    //如果要修改分辨率
    if ((opt.Width && opt.Width > 0) || (opt.Heigth && opt.Heigth > 0)) {
        let w = 0, h = 0;
        if (opt.Width == 0) {
            h = opt.Heigth;
            w = parseInt(info.Width * h / info.Height);
        } else if (opt.Heigth == 0) {
            w = opt.Width;
            h = parseInt(info.Height * w / info.Width);
        } else {
            w = opt.Width;
            h = opt.Heigth;
        }
        //加上感叹号!表示强制转换到这个分辨率，否则会按照等比例缩放
        args.push("-resize", `${w}x${h}!`)
    }
    //如果需要进行压缩
    if (opt.Quality && opt.Quality > 0 && outFormat != PNG) {
        args.push("-quality", opt.Quality + "");
    }
    //如果没有特殊参数，判断输入输出文件格式是否相同，如果相同，则不做处理
    if (args.length > 0 || path.extname(tempFile) != path.extname(fileOut)) {
        args.push(tempFile, fileOut);
    }
    //如果需要使用ImageMagick处理
    if (args.length > 0) {
        await run(imageMagickConvertPath, ...args);
        //将临时文件路径指向输出文件，便于后续处理
        tempFile = fileOut
    }

    //如果是png，且需要压缩
    if (opt.Quality && opt.Quality > 0 && outFormat == PNG) {
        if (opt.PngQunlityMin == null || opt.PngQunlityMin > opt.Quality) {
            opt.PngQunlityMin = 1;
        }
        args = [
            "--force", "--quiet", "--ordered", "--speed=1", `--quality=${opt.PngQunlityMin}-${opt.Quality}`, tempFile, "--output", fileOut];
        await run(pngquantPath, ...args);
    }
}

exports.Run = run;
exports.Init = Init;
exports.ImageInfo = ImageInfo;
exports.Option = Option;
exports.Config = Config;
exports.Info = Info;
exports.Convert = Convert;