<template>
  <div class="g-core-image-upload-btn">
    <div v-show="!cropImg">
      <slot>{{text}}</slot>
      <form class="g-core-image-upload-form" v-show="!hasImage" method="post" enctype="multipart/form-data">
        <input :disabled="uploading" :id="'g-core-upload-input-' + formID" :name="name" :type="type"
               :accept="inputAccept" style="width: 100%; height: 100%;position: absolute;left: 0; padding-left: 0; padding-right: 0;" @change="change"  @click="getPhoto">
      </form>
      <div class="g-core-image-corp-container" :id="'vciu-modal-' + formID" v-show="hasImage">
        <crop ref="cropBox" :ratio="cropRatio"></crop>
      </div>
    </div>
    <div class="img-container" v-show="cropImg">
      <img :src="cropSrc" alt="" class="show-img" @click="showIMG(imgBigSrc)">
      <span class="close-img" @click="choseAgain"></span>
    </div>
    <show-img ref="showBox"></show-img>
  </div>
</template>
<style src="./style/style.css"></style>
<style>
  .g-core-image-upload-btn {
    padding-top: 44px;
  }
  .g-core-image-upload-form {
    display: block;
    cursor: pointer;
    width: 17.15rem;
    height: 6rem;
    opacity: 0;
    margin: 59px auto 0;
    /*padding-top: 15px;*/
    overflow: hidden
  }

  .show-img {
    width: 343px;
    height: 343px;
    border-radius: 5px;
  }

  .img-container {
    position: relative;
    padding-top: 15px;
  }

  .close-img {
    display: inline-block;
    width: 24px;
    height: 24px;
    background: url("../assets/close-img.png") no-repeat center;
    background-size: 100% 100%;
    position: absolute;
    right: 26px;
    top: 25px;
  }
</style>
<script>
  /* global wa */
  import canvasHelper from './lib/canvas-helper'
  import {toust} from 'xbj-util/src/toust'
  import props from './props'
  import Crop from './crop.vue'
  import * as Request from '../request'
  import loading from 'xbj-util/src/loading'
  import JSBridge from 'JSBridge'

  const jsbridge = new JSBridge()

  export default {
    components: {
      Crop
    },
    props: props,
    data () {
      return {
        files: [],
        hasImage: false,
        options: this.props,
        uploading: false,
        formID: (Math.random() * 10000 + '').split('.')[0],
        image: {
          src: '',
          width: 24,
          height: 24,
          minProgress: 0.05
        },
        cropSrc: '',
        fileName: '',
        cropImg: false,
        imgBigSrc: '',
        imgSmallSrc: '',
        showImg: false,
        type: 'button',
        userA: 'android',
        userBoolean: navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
        size: ''
      }
    },

    mounted () {
      wa('set', 'module', 'app.xbj.everyday.publish')
      this.type = this.userBoolean ? 'file' : 'button'
      this.userA = this.userBoolean ? 'ios' : 'android'
      const self = this
      jsbridge.on('photo', function (res) {
        let data = JSON.parse(res.data)
        self.androidImg(data)
      })
    },
    computed: {
      name () {
        if (this.multiple) {
          return this.inputOfFile + '[]'
        }
        return this.inputOfFile
      }
    },
    methods: {
      __dispatch (name, res) {
        this.$emit && this.$emit(name, res)
      },
      __find (str) {
        let dq = document.querySelector('#vciu-modal-' + this.formID)
        return dq.querySelector(str)
      },
      getPhoto (e) {
        wa('send', 'picture.click')
        if (this.userA === 'ios') {
          this.files = e.target.files
          return
        } else {
          jsbridge.callNative('wenba://xuebajun?action=getPhoto&data={"from":"camera_gallery", "edit": "true"}')
        }
      },

      // 安卓手机处理图片
      androidImg (data) {
        loading.show()
        let fileBase = data.file.replace(/(%0A)/g, '')
        let source = decodeURIComponent(fileBase)
        this.size = data.length
        this.src = 'data:image/' + data.extension + ';base64,' + source
        this.uploadImg({'base64Img': encodeURIComponent(this.src)})
        this.__initImage(this.src)
      },
      change (e) {
        this.files = e.target.files
        this.size = this.files[0].size
        console.log(this.size)
        this.__dispatch('imagechanged', this.files.length > 1 ? this.files : this.files[0])
        let self = this
        if (this.compress && this.files[0]['type'] !== 'image/gif') {
          canvasHelper.compress(this.files[0], (file, code) => {
            loading.show()
            let uploadfile = {'base64Img': encodeURIComponent(code)}
            self.__initImage(code)
            self.uploadImg(uploadfile)
          })
        } else {
          toust('暂不支持该文件格式')
        }
      },

      // 上传图片
      uploadImg (data) {
        let self = this
        Request.uploadImg(data)
          .then((res) => {
            if (res.data.statusCode === 0) {
              self.hasImage = true
              self.imgBigSrc = res.data.url
            } else {
              toust(res.data.msg)
              self.hasImage = false
              self.resetFile()
            }
            loading.hide()
          })
          .catch((error) => {
            console.log(error)
          })
      },
      // set the image size
      __initImage (src) {
        let pic = new Image()
        let self = this
        pic.src = src
        const cropBox = this.$refs.cropBox
        pic.onload = function () {
          self.image.minProgress = self.minWidth / pic.naturalWidth
          self.imgChangeRatio = cropBox.setImage(src, pic.naturalWidth, pic.naturalHeight)
        }
      },

      resizeImage (progress) {
        const cropBox = this.$refs.cropBox
        cropBox.resizeImage(progress)
      },

      // 切割图片
      doCrop (e) {
        this.__setData('crop')
//        let self = this
        const cropBox = this.$refs.cropBox
        const targetImage = cropBox.getCropImage()
        return canvasHelper.crop(targetImage, this.size, this.data, (code) => {
          let uploadfile = {'base64Img': encodeURIComponent(code)}
          loading.show()
          this.hasImage = false
          Request.uploadImg(uploadfile)
            .then((res) => {
              if (res.data.statusCode === 0) {
                this.cropSrc = code
                this.cropImg = true
                this.imgSmallSrc = res.data.url
                this.$parent.getImgSrc()
              } else {
                toust(res.data.msg)
                this.hasImage = false
              }
              loading.hide()
            })
        })
      },
      __setData (type) {
        if (typeof this.data !== 'object') {
          this.data = {}
        }
        this.data['request'] = type
        const cropBox = this.$refs.cropBox
        const newCSSObj = cropBox.getCropData()
        for (const k of Object.keys(newCSSObj)) {
          this.data[k] = newCSSObj[k]
        }
        if (this.maxWidth) {
          this.data['maxWidth'] = this.maxWidth
        }
        if (this.maxHeight) {
          this.data['maxHeight'] = this.maxHeight
        }
        if (this.minWidth) {
          this.data['minWidth'] = this.minWidth
        }
      },

      resetFile () {
        document.querySelector('.g-core-image-upload-form').reset()
        this.hasImage = false
      },

      // base64 to blob
      dataURItoBlob (dataURI) {
        var byteString
        if (dataURI.split(',')[0].indexOf('base64') >= 0) {
          byteString = atob(dataURI.split(',')[1])
        } else {
          byteString = unescape(dataURI.split(',')[1])
        }

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length)
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }

        return new Blob([ia], {type: mimeString})
      },

      choseAgain () {
        this.cropSrc = ''
        this.cropImg = false
        this.imgBigSrc = ''
        this.$refs.cropBox.resetImg()
      },

      showIMG (src) {
        this.$refs.showBox.getSrc(src)
      }
    }
  }

</script>
