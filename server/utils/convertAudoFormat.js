const ffmpeg = require('fluent-ffmpeg')
var util = {
  covertFormat: function (inputPath, outputPath) {
    return new Promise(function (resolve, reject) {
      if (inputPath && outputPath) {
        var convertCommand = ffmpeg(inputPath)
        .saveToFile(outputPath)
        .on('end', function (err, res) {
          if (err) {
            reject(err)
          } else {
            resolve(outputPath)
          }
        })
        .on('error', function (err) {
          debugger
          reject(err)
        })
      } else {
        reject(new Error('Param invalid'))
      }
    })
  }
}

module.exports = util
