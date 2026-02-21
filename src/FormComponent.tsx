import { Component, For } from "solid-js"
import FormInput from "./FormInput"
import { ComponentType } from "./FormType"

const FormComponent: Component<{
  onMobile: boolean
  components: ComponentType | any
  dataKey: string
  index: number[]
  config : any
  uploadHandler : any
  GpsHandler : any
  offlineSearch : any
  onlineSearch : any
  openMap : any
  setResponseMobile: any
  audioHandler?: any
  barcodeHandler?: any
  videoHandler?: any
  fileHandler?: any
}> = props => {

  return (
    <div class="flex-grow bg-white dark:bg-gray-900 overflow-y-auto mb-20">
      <div class="space-y-3 sm:p-7 p-3">
        <For each={props.components}
          children={(component:any, index) =>
            FormInput({
                onMobile: props.onMobile,
                component,
                index: index(),
                config: props.config,
                MobileUploadHandler: props.uploadHandler,
                MobileGpsHandler: props.GpsHandler,
                MobileOfflineSearch : props.offlineSearch,
                MobileOnlineSearch : props.onlineSearch,
                MobileOpenMap : props.openMap,
                MobileAudioHandler: props.audioHandler,
                MobileBarcodeHandler: props.barcodeHandler,
                MobileVideoHandler: props.videoHandler,
                MobileFileHandler: props.fileHandler,
                setResponseMobile: props.setResponseMobile})} />
      </div>
    </div>
  )
}

export default FormComponent