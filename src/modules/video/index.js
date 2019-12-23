import dashboard from './dashboard'

/**
 * insert image
 * Created by peak on 16/8/18.
 */
export default {
    name: 'video',
    icon: 'fa fa-file-video-o',
    i18n: 'video',
    config: {
        // server: null,
        // fieldName: 'image',
        // compress: true,
        // width: 1600,
        // height: 1600,
        // quality: 80,
        sizeLimit: 10000 * 1024,// 10m
        // upload: {
        //     url: null,
        //     headers: {},
        //     params: {},
        //     fieldName: {}
        // },
        compress: {
            width: 1600,
            height: 1600,
            quality: 80
        },
        uploadHandler(responseText){
            const json = JSON.parse(responseText)
            return json.ok ? json.data : null
        }
    },
    dashboard
}
