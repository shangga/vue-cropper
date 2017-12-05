<template>
  <div class="image-aside" v-show="getImg">
    <div class="g-crop-image-box">
      <div class="g-crop-image-principal" >
        <img ref="crop-image" style="width:0; height: 0;" :src="src"/>
        <div class="image-mask">
          <img :src="src"
               class="image-wrap"
               :style="{ width: width + 'px', left: left + 'px', top: top + 'px'}" />
          <div class="mask top" :style="{ top:0, height: cropCSS.top + 'px', left: 0, width: '100%', lineHeight: cropCSS.top + 'px'}">
            选择缩略图展示区域
          </div>
          <div class="mask bottom"
               :style="{ bottom:0, top: (cropCSS.top + cropCSS.height) + 'px', left: 0, width: '100%'}">
            <div class="back" @click="resetImg"></div>
            <img src="../assets/ok.png" alt="" class="ok-icon" @click="$parent.doCrop">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .g-crop-image-principal {
    overflow: hidden;
    position: relative;
    background: transparent;

    /*rgba(0,0,0,.6)*/
  }

  .image-aside {
    /*overflow: hidden;*/
    position: absolute;
    right: 0;
    left: 0;
    bottom: 0;
    top: 0;
    text-align: center;
  }

  .image-aside .image-wrap {
    position: absolute;
    left: 0;
    top: 0;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    box-shadow: 0 3px 5px -2px rgba(0, 0, 0, .25);
    background-size: cover;
  }

  .image-mask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  .image-mask .mask {
    position: absolute;
    background-color: rgba(0, 0, 0, .6);
  }

  .top {
    font-size: 17px;
    color: #FFF;
    vertical-align: middle;
  }

  .crop-box {
    z-index: 2000;
    box-sizing: border-box;
    position: absolute;
    background: none;
    cursor: move;
    width: 100%;
    border: 1px solid rgba(255, 255, 255, .95);
  }

  .ok-icon {
    width: 80px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .crop-box .g-resize {
    display: inline-block;
    z-index: 1910;
    position: absolute;
    bottom: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    cursor: se-resize;
    border-radius: 10px;
    background-color: #fff;
    box-shadow: 0 2px 4px -2px rgba(0, 0, 0, .25);
  }

  .back {
    border-bottom: 2px solid #FFF;
    border-left: 2px solid #FFF;
    height: 18px;
    width: 18px;
    position: absolute;
    transform: rotate(45deg);
    left: 20%;
    top: 50%;
    margin-top: -9px;
  }
</style>
<script>
  import AlloyFinger from 'alloyfinger'
  import Transform from 'css3transform'

  const areaWidth = window.innerWidth
  const areaHeight = window.innerHeight
  export default {
    components: {},
    props: {
      ratio: {
        type: String,
        default: '1:1'
      },
      minWidth: {
        type: Number,
        default: 50
      },
      minHeight: {
        type: Number,
        default: 50
      },
      isResize: {
        type: [Boolean],
        default: false
      }
    },

    data () {
      return {
        width: 24,
        height: 24,
        initWidth: 24,
        initHeight: 24,
        left: 0,
        top: 0,
        src: '',
        cropCSS: {},
        imgScale: 1,
        imgOriginRadio: '',
        getImg: false,
        img: ''
      }
    },

    mounted () {
      this.img = document.querySelector('.image-wrap')
//      let initScale = 1
      let self = this
      Transform(this.img)
      new AlloyFinger(self.img, {
        // 放大方法
//        pinch (e) {
//          if (initScale * e.zoom > 4) {
//            return
//          }
//          self.img.scaleX = self.img.scaleY = initScale * e.zoom
//          self.imgScale = initScale * e.zoom
//        },
        pressMove (e) {
//          去掉左右滑动
//          self.left = (self.img.offsetLeft + e.deltaX) !==0
          self.top = self.img.offsetTop + e.deltaY
          e.preventDefault()
        },
        multipointStart: function () {
//          initScale = self.img.scaleX
        }
      })
    },

    methods: {
      setImage (src, w, h) {
        this.getImg = true
        this.src = src
        if (this.ratio.indexOf(':') > 0) {
          this.ratioW = this.ratio.split(':')[0]
          this.ratioH = this.ratio.split(':')[1]
        } else {
          this.ratioW = 1
          this.ratioH = 1
        }
        this.natrualWidth = w
        this.setLayout(w, h)
        return this.imgChangeRatio
      },

      setLayout (w, h) {
        let H = areaHeight
        let W = areaWidth
        let width = w // 图宽
        let height = h // 图高
        let marginLeft = 0
        let marginTop = 0
        // 图片比例
        let R = width / height
        this.imgOriginRadio = R
        // 窗口比例
        let Rw = W / H
        width = W
        if (R > Rw) {
          height = width / R
        } else {
          height = width / Rw
        }
        marginLeft = (W - width) / 2
        this._setStyle(width, H, marginLeft, marginTop, R, true)
      },

      _setStyle (w, h, ml, mt, r, isInit) {
        const $container = this.$el.querySelector('.g-crop-image-principal')
        if (!isInit) {
          this.marginLeft = this.marginLeft + (this.width - w) / 2
          this.marginTop = this.marginTop + (this.height - h) / 2
        }
        $container.style.cssText = 'color: red; height:' + h + 'px;margin-left:' + ml + 'px;' + 'margin-top:' + mt + 'px'
        this.setCropBox(w, h)
        if (r >= 1) {  // 图片宽高比大于1说明比较宽
          this.height = this.cropCSS.width / r
          this.width = w
        } else {
          this.width = this.cropCSS.width
          this.height = this.width / r
        }
        this.initWidth = this.width
        this.initHeight = this.height
        this.left = (w - this.width) / 2
        this.top = (h - this.height) / 2
        // 图像显示的缩放比例
        this.imgChangeRatio = this.width / this.natrualWidth
      },

      // 设置裁切
      setCropBox (w, h, r) {
        // 图片的宽和高
        let imageWidth = w
        let imageHeight = h

        // 图片的比例
        let ratioW = this.ratioW
        let ratioH = this.ratioH
        let cropWidth = window.innerWidth
        // 此时的窗口宽度与图片宽度相等
        if (areaWidth < w) {
          cropWidth = areaWidth
        }
        const baseCropWidth = cropWidth

        // 设置裁切框的样式
        const CSSObj = {
          width: baseCropWidth,
          height: (baseCropWidth / ratioW) * ratioH
        }
        CSSObj.left = (imageWidth - baseCropWidth) / 2
        CSSObj.top = (imageHeight - CSSObj.height) / 2

        if (CSSObj.height > imageHeight) {
          const baseCropHeight = imageHeight
          CSSObj.height = baseCropHeight
          CSSObj.width = (CSSObj.height * ratioW) / ratioH
          CSSObj.left = (imageWidth - CSSObj.width) / 2
          CSSObj.top = (imageHeight - CSSObj.height) / 2
        }
        this.cropCSS = CSSObj
      },

      // 获取切割数据
      getCropData () {
        var imgRect = document.querySelector('.image-wrap').getBoundingClientRect()
        let imgWidth = imgRect.width
        let imgHeight = imgRect.height
        let imgTop = imgRect.top
        let imgLeft = imgRect.left
        let cropY = 0
        let cropX = 0
        let cropW = 0
        let cropH = 0
//        let destX = 0
        let destY = 0
        cropW = this.cropCSS.width / this.imgChangeRatio
        cropH = this.cropCSS.height / this.imgChangeRatio
        // 求裁切盒子的宽高比
//        let cropHBoxRadio = 0

        // 正常大小
        if (this.imgScale === 1 && this.imgOriginRadio < (this.cropCSS.width / this.cropCSS.height)) {
          // 当竖直方向的偏移量超出最大高度时
          if (this.cropCSS.top - this.top + this.cropCSS.height > this.width / this.imgOriginRadio) {
            // 高于裁切框
            cropY = (this.width / this.imgOriginRadio - this.cropCSS.height) / this.imgChangeRatio
          } else {
            // 低于裁切框
            cropY = (this.cropCSS.top - this.top) > 0 ? (this.cropCSS.top - this.top) / this.imgChangeRatio : 0
          }

          // 当水平方向的偏移量超出最大宽度时
          if (this.cropCSS.left - this.left + this.cropCSS.width > this.width) {
            cropX = (this.width - this.cropCSS.width) / this.imgChangeRatio
          } else {
            cropX = (this.cropCSS.left - this.left) > 0 ? (this.cropCSS.left - this.left) / this.imgChangeRatio : 0
          }
        }
        if (this.imgOriginRadio > (this.cropCSS.width / this.cropCSS.height)) {
          // 当图片被缩放的时候，如果图片宽高比大于1说明图片比较宽，应该取全部高度，部分宽度
          if (this.imgOriginRadio > 1) {
//            cropHBoxRadio = this.cropCSS.height / this.cropCSS.width / this.imgOriginRadio
            cropY = 0
            // 求图片变化的宽度
            destY = (this.cropCSS.height - imgHeight) / 2 / this.imgChangeRatio
            cropX = 0 // (this.cropCSS.height / this.imgChangeRatio * this.imgOriginRadio - this.cropCSS.width / this.imgChangeRatio) / 2 * cropHBoxRadio
//            cropW = cropW * cropHBoxRadio
//            cropH = cropH * cropHBoxRadio
          } else {
            cropX = 0
            cropY = (this.cropCSS.width / this.imgChangeRatio / this.imgOriginRadio - this.cropCSS.height / this.imgChangeRatio) / 2
          }
        }
        if (this.imgScale > 1) {
          // 比较顶部是否超出
          if (this.cropCSS.top - imgTop + this.cropCSS.height > imgHeight) {
            cropY = (imgHeight - this.cropCSS.height) / this.imgChangeRatio
          } else {
            cropY = (this.cropCSS.top - imgTop) > 0 ? (this.cropCSS.top - imgTop) / this.imgChangeRatio : 0
          }
          // 宽度是否超出
          if (this.cropCSS.left - imgLeft + this.cropCSS.width > imgWidth) {
            cropX = (imgWidth - this.cropCSS.width) / this.imgChangeRatio
          } else {
            cropX = (this.cropCSS.left - imgLeft) > 0 ? ((this.cropCSS.left - imgLeft)) / this.imgChangeRatio : 0
          }
        }
        // 获取裁切的数据
        return {
          toCropImgX: cropX,
          toCropImgY: cropY,
          toCropImgW: cropW,
          toCropImgH: cropH,
          destY: destY,
          imgChangeRatio: this.imgChangeRatio,
          imgOriginRadio: this.imgOriginRadio,
          scale: this.imgScale
        }
      },

      getCropImage () {
        return this.$refs['crop-image']
      },

      __find (str) {
        let dq = this.$el
        return dq.querySelector(str)
      },

      resetImg () {
        this.getImg = false
        this.hasImage = false
        this.img.scaleX = this.img.scaleY = 1
        this.src = ''
        this.$parent.resetFile()
      }
    }
  }
</script>
