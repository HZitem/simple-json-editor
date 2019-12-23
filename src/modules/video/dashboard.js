import lrz from 'lrz'
import template from './dashboard.html'
import Command from '../../range/command'

/**
 * Created by peak on 2017/2/10.
 */
export default {
    template,
    data() {
        return {
            imageUrl: '',
            upload: {
                status: 'ready', // progress,success,error,abort
                errorMsg: null,
                progressComputable: false,
                complete: 0
            }
        }
    },
    methods: {
        reset(){
            this.upload.status = 'ready'
        },
        insertImageUrl() {
            if (!this.imageUrl) {
                return
            }
            this.$parent.execCommand(Command.INSERT_VIDEO, this.imageUrl)
            this.imageUrl = null
        },
        pick() {
            this.$refs.file.click()
        },
        setUploadError(msg){
            this.upload.status = 'error'
            this.upload.errorMsg = msg
        },
        process() {
            const component = this
            const config = this.$options.module.config
            // compatibility with older format
            // {
            //     server: null,
            //     fieldName: 'image',
            //     compress: true,
            //     width: 1600,
            //     height: 1600,
            //     quality: 80
            // }
            // ----------- divider ----------------
            // {
            //     upload: {
            //         url: null,
            //         headers: {},
            //         params: {},
            //         fieldName: {}
            //     },
            //     compress: {
            //         width: 1600,
            //         height: 1600,
            //         quality: 80
            //     },
            // }
            console.log(config)
            if (!config.upload && typeof config.server === 'string') {
                config.upload = {url: config.server}
                console.log(1)
            }
            if (config.upload && !config.upload.url) {
                config.upload = null
                console.log(2)
            }
            if (config.upload && typeof config.fieldName === 'string') {
                config.upload.fieldName = config.fieldName
                console.log(3)
            }

            if (typeof config.compress === 'boolean') {
                console.log(4)
                config.compress = {
                    width: config.width,
                    height: config.height,
                    quality: config.quality
                }
            }

            const file = this.$refs.file.files[0]
            if (file.size > config.sizeLimit) {
                console.log(5)
                this.setUploadError(this.$parent.locale['exceed size limit'])
                return
            }
            this.$refs.file.value = null

            if (config.compress) {
                console.log(6)
                config.compress.fieldName = config.upload && config.upload.fieldName
                    ? config.upload.fieldName : 'video'
                // lrz(file, config.compress).then((rst) => {
                //     if (config.upload) {
                //         component.uploadToServer(rst.file)
                //     } else {
                //         component.insertBase64(rst.base64)
                //     }
                // }).catch((err) => {
                //     console.log('erro')
                //     this.setUploadError(err.toString())
                // })
                // return
            }
            // 不需要压缩
            // base64
            if (!config.upload) {
                console.log(7)
                const reader = new FileReader()
                reader.onload = (e) => {
                    component.insertBase64(e.target.result)
                }
                reader.readAsDataURL(file)
                return
            }
            // 上传服务器
            // component.uploadToServer(file)
        },
        insertBase64(data) {
            this.$parent.execCommand(Command.INSERT_VIDEO, data)
        },
        uploadToServer(file) {
            const config = this.$options.module.config

            const formData = new FormData()
            formData.append(config.upload.fieldName || 'video', file)

            if (typeof config.upload.params === 'object') {
                Object.keys(config.upload.params).forEach((key) => {
                    const value = config.upload.params[key]
                    if (Array.isArray(value)) {
                        value.forEach((v) => {
                            formData.append(key, v)
                        })
                    } else {
                        formData.append(key, value)
                    }
                })
            }

            const xhr = new XMLHttpRequest()

            xhr.onprogress = (e) => {
                this.upload.status = 'progress'
                if (e.lengthComputable) {
                    this.upload.progressComputable = true
                    const percentComplete = e.loaded / e.total
                    this.upload.complete = (percentComplete * 100).toFixed(2)
                } else {
                    this.upload.progressComputable = false
                }
            }

            xhr.onload = () => {
                if (xhr.status >= 300) {
                    this.setUploadError(`request error,code ${xhr.status}`)
                    return
                }

                try {
                    const url = config.uploadHandler(xhr.responseText)
                    if (url) {
                        this.$parent.execCommand(Command.INSERT_IMAGE, url)
                    }
                } catch (err) {
                    this.setUploadError(err.toString())
                } finally {
                    this.upload.status = 'ready'
                }
            }

            xhr.onerror = () => {
                // find network info in brower tools
                this.setUploadError('request error')
            }

            xhr.onabort = () => {
                this.upload.status = 'abort'
            }

            xhr.open('POST', config.upload.url)
            if (typeof config.upload.headers === 'object') {
                Object.keys(config.upload.headers).forEach((k) => {
                    xhr.setRequestHeader(k, config.upload.headers[k])
                })
            }
            xhr.send(formData)
        }
    }
}
