import { Component, JSXElement, ParentComponent } from "solid-js";
import { ComponentType, Option } from "../../../FormType";
import InputContainer from "./InputContainer";
import OptionSection from "./OptionSection";

export {
    InputContainer,
    OptionSection
}

export type InputContainerBase = ParentComponent<{
    component: ComponentType
    optionSection?: JSXElement | (() => JSXElement)
    classValidation?: any
    validationMessage?: any
}>

export interface OptionSectionBase extends Component<{
    component: ComponentType
    options: Option[]
    settedValue: any,
    onValueChange?: (value: any, label?: string, open?: boolean) => void
    disableInput: boolean
    value?: any
}> { }
