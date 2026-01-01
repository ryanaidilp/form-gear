import { createSignal, For, Match, Show, Switch } from "solid-js";
import { FormComponentBase } from "../FormType"

const SingleCheckInput: FormComponentBase = props => {
    const config = props.config
    const [disableInput] = createSignal((config.formMode > 1 ) ? true : props.component.disableInput)

    // Local state to prevent re-render issues during save
    const [val, setVal] = createSignal(props.value !== '' ? props.value : false);

    const [instruction, setInstruction] = createSignal(false);
    const showInstruction = () => {
      (instruction()) ? setInstruction(false) : setInstruction(true);
    }

    let handleLabelClick = () => {
        let id  = "singlecheck-"+props.component.dataKey+"_id"
        document.getElementById(id).click()
    }


    return (
        <div class="border-b border-gray-300/[.50] dark:border-gray-200/[.10] p-2">
            <div class="font-light text-sm py-2.5 px-2">
                <div
                    classList={{
                        ' border-b border-orange-500 pb-3 ' : props.classValidation === 1,
                        ' border-b border-pink-600 pb-3 ' : props.classValidation === 2,
                    }}>
                    <div class="flex items-start gap-2">
                        <input class="appearance-none h-5 w-5 min-w-5 min-h-5 border-2 mt-0.5 shrink-0
                            border-gray-300 rounded bg-white
                            checked:bg-blue-600 checked:border-blue-600
                            focus:outline-none transition duration-200
                            bg-no-repeat bg-center bg-contain cursor-pointer"
                            type="checkbox"
                            id={ 'singlecheck-' +  props.component.dataKey + '_id' }
                            disabled = { disableInput() }
                            checked={val() === true}
                            onChange={(e) => {
                                setVal(e.target.checked);
                                props.onValueChange(e.target.checked);
                            }} />
                        <div class="flex-1">
                            <div class="inline-flex space-x-2 flex-wrap">
                                <div innerHTML={props.component.label} onClick={e => handleLabelClick()} class="cursor-pointer" />
                                <Show when={props.component.required}>
                                    <span class="text-pink-600">*</span>
                                </Show>
                                <Show when={props.component.hint}>
                                <button class="bg-transparent text-gray-300 rounded-full focus:outline-none h-4 w-4 hover:bg-gray-400 hover:text-white flex justify-center items-center"
                                    onClick={showInstruction}>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                </Show>
                            </div>
                        </div>
                    </div>
                    <div class="flex mt-2 ml-7">
                        <Show when={instruction()}>
                        <div class="italic text-xs font-extralight text-zinc-400 " innerHTML={props.component.hint} />
                        </Show>
                    </div>
                </div>
                <Show when={props.validationMessage?.length > 0}>
                    <For each={props.validationMessage}>
                    {(item:any) => (
                        <div
                        class="text-xs font-light mt-1">
                        <div class="flex gap-2"
                            classList={{
                            ' text-orange-500 dark:text-orange-200 ' : props.classValidation === 1,
                            ' text-pink-600 dark:text-pink-200 ' : props.classValidation === 2,
                            }} >
                            <Switch>
                            <Match when={props.classValidation === 1}>
                                <div class="flex justify-center items-start shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                </div>
                            </Match>
                            <Match when={props.classValidation === 2}>
                                <div class="flex justify-center items-start shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                </div>
                            </Match>
                            </Switch>
                            <div class="text-justify" innerHTML={item}/>
                        </div>
                        </div>
                    )}
                    </For>
                </Show>
            </div>
        </div>
    )

}

export default SingleCheckInput
