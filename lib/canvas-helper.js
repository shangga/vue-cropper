/**
 * compress image
 * reference https://github.com/brunobar79/J-I-C
 **/
import Html5ImgCompress from 'html5-image-compress'
export default {
  _getImageType (str) {
    let mimeType = 'image/jpeg'
    const outputType = str.match(/(image\/[\w]+)\.*/)[0]
    if (typeof outputType !== 'undefined') {
      mimeType = outputType
    }
    return mimeType
  },

  compress (src, callback) {
    new Html5ImgCompress(src, {
      before () {
      },
      done (file, target) {
        callback(file, target)
      }
    }, false)
  },
  /**
   * crop image via canvas and generate data
   **/
  crop (image, size, options, callback) {
    const checkNumber = function (num) {
      return (typeof num === 'number')
    }

    let scales = 1
    // check crop options
    if (checkNumber(options.toCropImgX) && checkNumber(options.toCropImgY) && options.toCropImgW > 0 && options.toCropImgH > 0) {
      let w = options.toCropImgW
      let h = options.toCropImgH
      let x = options.toCropImgX
      let y = options.toCropImgY
      // 用于放大图片的处理
      if (options.scale > 1) {
        w = w / options.scale
        h = h / options.scale
        x = x / options.scale
        y = y / options.scale
      }
      if (size / 1024 > 200) {
        scales = 2
      }
      const cvs = this._getCanvas(options.toCropImgW / scales, options.toCropImgH / scales)
      const ctx = cvs.getContext('2d')
      ctx.drawImage(image, x, y, w, h, 0, options.destY / scales, options.toCropImgW / scales, options.toCropImgH / scales)
      // cvs.getContext('2d').drawImage(image, x, y, 647, 647, 0, options.destY / 2, options.toCropImgW / 2, options.toCropImgH / 2)
      const mimeType = this._getImageType(image.src)
      const data = cvs.toDataURL(mimeType, 1)
      callback(data)
    }
  },

  _loadImage (data, callback) {
    const image = new Image()
    image.src = data
    image.onload = function () {
      console.log(image.size)
      callback(image)
    }
    image.onerror = function () {
      console.log('Error: image error!')
    }
  },

  _getCanvas (width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
}
