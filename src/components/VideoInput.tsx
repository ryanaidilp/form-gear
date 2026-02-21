import { createEffect, createSignal, Switch, Match, Show, For } from "solid-js";
import { FormComponentBase } from "../FormType";
import { toastSuccess, toastError } from "../utils/toast";
import RemarkButton from './ui/RemarkButton';
import ActionButton from './ui/ActionButton';

const VideoInput: FormComponentBase = props => {
  const [fileSource, setFileSource] = createSignal('');
  const [fileName, setFileName] = createSignal('');

  const config = props.config;
  const [disableInput] = createSignal((config.formMode > 1) ? true : props.component.disableInput);

  createEffect(() => {
    if (props.value[0]) {
      setFileSource(props.value[0].value);
      setFileName(props.value[0].label || '');
    } else {
      setFileSource('');
      setFileName('');
    }
  });

  const clearRecording = () => {
    props.onValueChange([]);
  };

  const handleResult = (data: string) => {
    try {
      const event = JSON.parse(data);
      const updatedAnswer = [{ value: event.value, label: event.label, type: event.type }];
      props.onValueChange(updatedAnswer);
      toastSuccess('Video recorded successfully!');
    } catch {
      toastError('Failed to process video result');
    }
  };

  const clickMobileVideo = () => {
    props.MobileVideoHandler(handleResult);
  };

  // CAWI: file input
  const getFileContent = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const allowed = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'];
      const file = input.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext)) {
        toastError('Please submit a valid video format!');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = ev => {
        const dataUrl = ev.target.result as string;
        setFileSource(dataUrl);
        setFileName(file.name);
        const updatedAnswer = [{ value: dataUrl, label: file.name, type: file.type }];
        props.onValueChange(updatedAnswer);
        toastSuccess('Video uploaded successfully!');
      };
    }
  };

  const [instruction, setInstruction] = createSignal(false);
  const showInstruction = () => setInstruction(v => !v);

  const [enableRemark] = createSignal(props.component.enableRemark !== undefined ? props.component.enableRemark : true);
  const [disableClickRemark] = createSignal((config.formMode > 2 && props.comments == 0) ? true : false);

  return (
    <div>
      <div class="grid grid-cols-12 border-b border-gray-300/[.40] dark:border-gray-200/[.10] p-2">

        <div class="font-light text-sm space-y-2 py-2.5 px-2 col-span-11">
          <div class="inline-flex space-x-2">
            <div innerHTML={props.component.label} />
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
          <div class="flex mt-2">
            <Show when={instruction()}>
              <div class="italic text-xs font-extralight text-zinc-400" innerHTML={props.component.hint} />
            </Show>
          </div>
        </div>

        <div class="font-light text-sm space-x-2 py-2.5 px-2 space-y-4 flex justify-end -mt-2">
          <Switch>
            <Match when={config.clientMode == 2}>
              <ActionButton
                color="pink"
                disabled={disableInput()}
                onClick={clickMobileVideo}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </ActionButton>
            </Match>
            <Match when={config.clientMode == 1}>
              <input
                type="file"
                accept="video/*"
                class="hidden"
                id={"videoFile_" + props.component.dataKey}
                onchange={getFileContent}
              />
              <ActionButton
                color="pink"
                disabled={disableInput()}
                onClick={() => (document.getElementById("videoFile_" + props.component.dataKey) as HTMLInputElement).click()}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </ActionButton>
            </Match>
          </Switch>

          <Show when={enableRemark()}>
            <RemarkButton
              disabled={disableClickRemark()}
              onClick={() => props.openRemark(props.component.dataKey)}
              comments={props.comments}
            />
          </Show>
        </div>

        <Show when={fileSource() != ''}>
          <div class="col-span-12 px-2 py-2">
            <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <video controls class="w-full max-h-64" src={fileSource()} />
              <div class="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300 truncate flex-1">{fileName()}</span>
                <Show when={!disableInput()}>
                  <button
                    class="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={clearRecording}
                    title="Remove recording">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        <div class="col-span-12"
          classList={{
            ' border-b border-orange-500 pb-3 ': props.classValidation === 1,
            ' border-b border-pink-600 pb-3 ': props.classValidation === 2,
          }}>
        </div>
        <div class="col-span-12 pb-4">
          <Show when={props.validationMessage?.length > 0}>
            <For each={props.validationMessage}>
              {(item: any) => (
                <div class="text-xs font-light mt-1">
                  <div class="grid grid-cols-12"
                    classList={{
                      ' text-orange-500 dark:text-orange-200 ': props.classValidation === 1,
                      ' text-pink-600 dark:text-pink-200 ': props.classValidation === 2,
                    }}>
                    <Switch>
                      <Match when={props.classValidation === 1}>
                        <div class="col-span-1 flex justify-center items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </Match>
                      <Match when={props.classValidation === 2}>
                        <div class="col-span-1 flex justify-center items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </Match>
                    </Switch>
                    <div class="col-span-11 text-justify mr-1" innerHTML={item} />
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>

      </div>
    </div>
  );
};

export default VideoInput;
