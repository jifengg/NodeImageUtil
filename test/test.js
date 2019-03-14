
let iu = require('../nodeimageutil');
let os = require('os');
let path = require('path');
let fs = require('fs');

async function test() {
    try {
        //修改命令行工具的位置，可以使用相对路径，也可以使用绝对路径。
        let err = await iu.Init(
            os.platform == 'linux' ?
                {
                    ImageMagickConvertPath: "convert",
                    ImageMagickIdentifyPath: "identify",
                    PngquantPath: "pngquant",
                    ShowDebug: true,
                    ShowError: true,
                }
                :
                {
                    ImageMagickConvertPath: "C:\\Program Files\\ImageMagick-7.0.8-Q16\\convert.exe",
                    ImageMagickIdentifyPath: "C:\\Program Files\\ImageMagick-7.0.8-Q16\\identify.exe",
                    PngquantPath: "E:\\Program Files (x86)\\pngquant\\pngquant.exe",
                    ShowDebug: true,
                    ShowError: true,
                }
        )
        if (err) {
            console.error("nodeimageutil can not init", err);
            return;
        } else {
            console.info("nodeimageutil init success")
        }

        let testFile = "./test/test_image/me.jpg";
        let tempDir = "./test/test_output";
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        //获取图片信息
        let info = await iu.Info(testFile);
        console.log("info", JSON.stringify(info, null, 4));

        /**
         * @type {iu.Option}
         */
        let opt = {
            Quality: 60,
            Width: 300,
            Heigth: 200
        };
        //转换一个jpg文件，生成一个300x200，质量参数为60的jpg文件
        await iu.Convert(testFile, path.join(tempDir, "me" + getFileNameSuffix(opt) + ".jpg"), opt);

        //转换一个jpg文件，生成一个宽度300，高度自动等比例缩放，质量参数为60的jpg文件
        opt.Heigth = 0;
        await iu.Convert(testFile, path.join(tempDir, "me" + getFileNameSuffix(opt) + ".jpg"), opt);

        //转换一个jpg文件成bmp文件，不附加任何参数
        opt = {}
        await iu.Convert(testFile, path.join(tempDir, "me" + getFileNameSuffix(opt) + ".bmp"), opt);

        opt = {
            Quality: 75,
            PngQunlityMin: 30
        }
        //转换一个jpg文件成png文件，不修改分辨率，pngquant压缩参数为30-75
        await iu.Convert(testFile, path.join(tempDir, "me" + getFileNameSuffix(opt) + ".png"), opt);

        opt = {
            Quality: 80,
            PngQunlityMin: 40
        }
        //转换一个jpg文件成png文件，不修改分辨率，pngquant压缩参数为40-80
        await iu.Convert(testFile, path.join(tempDir, "me" + getFileNameSuffix(opt) + ".png"), opt);

        opt = {
            Quality: 80,
            PngQunlityMin: 40,
            Width: 130,
            Heigth: 240
        }
        //转换一个jpg文件成png文件，分辨率修改为130x240，pngquant压缩参数为40-80
        await iu.Convert(testFile, path.join(tempDir, "me" + getFileNameSuffix(opt) + ".png"), opt);

        opt = {}
        let pngTempFile = path.join(tempDir, "temp.png");
        await iu.Convert(testFile, pngTempFile, opt)
        opt = {
            Quality: 90,
            PngQunlityMin: 50,
            Width: 233,
            Heigth: 322
        }
        //压缩一个png文件，分辨率修改为233x322，pngquant压缩参数为50-90
        await iu.Convert(pngTempFile, path.join(tempDir, "out" + getFileNameSuffix(opt) + ".png"), opt)

        console.log('end');
    } catch (error) {
        console.error('test() error:', JSON.stringify(error, null, 4));
    }
}

/**
 * 
 * @param {iu.Option} opt 
 */
function getFileNameSuffix(opt) {
    let name = '';
    if (opt.Width && opt.Width > 0) {
        name += `_w${opt.Width}`;
    }
    if (opt.Heigth && opt.Heigth > 0) {
        name += `_h${opt.Heigth}`;
    }
    if (opt.PngQunlityMin && opt.PngQunlityMin > 0) {
        name += `_qmin${opt.PngQunlityMin}`;
    }
    if (opt.Quality && opt.Quality > 0) {
        name += `_q${opt.Quality}`;
    }
    return name;
}

test();