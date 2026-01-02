import { ClientMode } from "../constants/index"
import { scrollCenterInput } from "../utils/helpers"

/**
 * Handle input focus event for PAPI mode.
 * Scrolls the input to center and updates current dataKey.
 *
 * @param e - Focus event
 * @param props - Component props containing config, component, and setInput
 */
export const handleInputFocus = (e: any, props: any) => {
    if (props.config.clientMode == ClientMode.PAPI) {
        const elem = props.isNestedInput ? e.target.offsetParent : e.target
        const scrollContainer = props.isNestedInput ? document.querySelector(".nested-container") as HTMLElement : null
        // Use setInput from props if available (context-based), otherwise skip
        if (props.setInput) {
            props.setInput('currentDataKey', props.component.dataKey)
        }
        scrollCenterInput(elem, scrollContainer)
    }
}
