import { createEffect, createSignal, Switch, Match, Show, For } from "solid-js";
import { FormComponentBase } from "../FormType";
import { toastSuccess, toastError } from "../utils/toast";
import RemarkButton from './ui/RemarkButton';
import ActionButton from './ui/ActionButton';

const BarcodeInput: FormComponentBase = props => {
  const [scannedValue, setScannedValue] = createSignal('');

  const config = props.config;
  const [disableInput] = createSignal((config.formMode > 1) ? true : props.component.disableInput);

  createEffect(() => {
    if (props.value[0]) {
      setScannedValue(props.value[0].value || '');
    }
  });

  const handleResult = (data: string) => {
    try {
      const event = JSON.parse(data);
      const updatedAnswer = [{ value: event.value, label: event.label, type: event.type }];
      props.onValueChange(updatedAnswer);
      toastSuccess('Barcode scanned successfully!');
    } catch {
      toastError('Failed to process barcode result');
    }
  };

  const clickMobileBarcode = () => {
    props.MobileBarcodeHandler(handleResult);
  };

  // CAWI: BarcodeDetector API or manual text input fallback
  const [manualMode, setManualMode] = createSignal(false);
  const [manualInput, setManualInput] = createSignal('');

  const submitManual = () => {
    const val = manualInput().trim();
    if (!val) {
      toastError('Please enter a barcode value!');
      return;
    }
    const updatedAnswer = [{ value: val, label: val, type: 'barcode' }];
    props.onValueChange(updatedAnswer);
    setManualInput('');
    toastSuccess('Barcode value saved!');
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
                onClick={clickMobileBarcode}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </ActionButton>
            </Match>
            <Match when={config.clientMode == 1}>
              <ActionButton
                color="pink"
                disabled={disableInput()}
                onClick={() => setManualMode(v => !v)}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

        {/* CAWI manual input */}
        <Show when={config.clientMode == 1 && manualMode()}>
          <div class="col-span-12 px-2 pb-2 flex gap-2">
            <input
              type="text"
              class="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-pink-400"
              placeholder="Enter barcode / QR value"
              value={manualInput()}
              onInput={e => setManualInput((e.target as HTMLInputElement).value)}
              onKeyDown={e => { if (e.key === 'Enter') submitManual(); }}
            />
            <button
              class="bg-pink-500 text-white text-xs px-3 py-1.5 rounded-md hover:bg-pink-600"
              onClick={submitManual}>
              OK
            </button>
          </div>
        </Show>

        <Show when={scannedValue() != ''}>
          <div class="col-span-12 px-2 py-2">
            <div class="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 mt-0.5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-mono text-xs text-gray-700 dark:text-gray-200 break-all">{scannedValue()}</span>
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

export default BarcodeInput;
