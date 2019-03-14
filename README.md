# NodeImageUtil
A image command line tool util for Nodejs。

对常用图像处理命令行工具的node封装。

目前使用[ImageMagick](https://github.com/ImageMagick/ImageMagick)来进行图片的裁剪、格式转换、压缩（非PNG）。
使用[pngquant](https://github.com/kornelski/pngquant)来进行PNG图片压缩。

要使用这个包，请保证系统中已经安装了ImageMagick和pngquant。安装方式请自行查找。


------

# install   安装

## npm

```shell
npm i nodeimageutil
```

# usage 使用

可参考`test/test.js`；

```javascript
let iu = require('../nodeimageutil');
//修改命令行工具的位置，可以使用相对路径，也可以使用绝对路径。
//Init并非必须要调用的方法，但是可以使用此方法测试命令行工具是否可用。
let err = await iu.Init({...});

//获取图片信息
let info = await iu.Info("filepath");
/*
{
    "IsKnowImage": true,
    "Width": 573,
    "Height": 573,
    "FileSize": 81166,
    "FilePath": "./test/test_image/me.jpg",
    "Format": "JPEG"
}
*/


//转换一个jpg文件，生成一个300x200，质量参数为60的jpg文件
let opt = {
    Quality: 60,
    Width: 300,
    Heigth: 200
};
await iu.Convert(testFile, path.join(tempDir, "out.jpg"), opt);



//转换一个jpg文件成png文件，不修改分辨率，pngquant压缩参数为40-80
opt = {
    Quality: 80,
    PngQunlityMin: 40
}
await iu.Convert(testFile, path.join(tempDir, "out.png"), opt);

```

