import { Component, For, Show } from 'solid-js';
import SidebarItem, { SidebarDetail } from './SidebarItem';
import { gearVersion } from '../../createFormGear';
import { ClientMode } from '../../core/constants';

export interface FormSidebarProps {
  sidebarDetails: SidebarDetail[];
  activeDataKey: string;
  activeIndex: number[];
  templateAcronym: string;
  templateVersion: string;
  validationVersion: string;
  clientMode: number;
  summary: {
    answer: number;
    blank: number;
    error: number;
    remark: number;
  };
  locale: {
    summaryAnswer: string;
    summaryBlank: string;
    summaryError: string;
    summaryRemark: string;
  };
  formMode: number;
  onSelect: (dataKey: string, label: string, index: number[], position: number) => void;
  onSidebarCollapse: (e: MouseEvent) => void;
  onWriteResponse: () => void;
  onShowBlank: (e: MouseEvent) => void;
  onShowError: (e: MouseEvent) => void;
  onShowRemark: (e: MouseEvent) => void;
  onSubmit: (e: MouseEvent) => void;
}

const FormSidebar: Component<FormSidebarProps> = (props) => {
  return (
    <Show when={props.clientMode !== ClientMode.PAPI}>
      {/* Mobile sidebar overlay */}
      <div
        class="sidebar-overlay fixed inset-0 bg-black/80 backdrop-blur-sm z-10 md:hidden opacity-0 pointer-events-none transition-all duration-300 ease-in-out"
        onClick={props.onSidebarCollapse}
      />

      <div class="bg-white dark:bg-gray-900 w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 h-screen p-5 sidebar-span fixed inset-y-0 left-0 -translate-x-full transition-all duration-300 ease-in-out md:relative md:translate-x-0 z-20 md:z-auto">
        {/* Header */}
        <div class="sm:min-h-[7rem] py-3 text-gray-400 tracking-wider flex justify-between">
          <SidebarHeader
            acronym={props.templateAcronym}
            templateVersion={props.templateVersion}
            validationVersion={props.validationVersion}
            clientMode={props.clientMode}
          />
          <button
            type="button"
            class="md:hidden p-2 mobile-menu-button"
            onClick={props.onSidebarCollapse}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <div class="h-3/6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-500 overflow-y-scroll scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
          <div>
            <For each={props.sidebarDetails}>
              {(item) => (
                <SidebarItem
                  item={item}
                  allItems={props.sidebarDetails}
                  activeDataKey={props.activeDataKey}
                  activeIndex={props.activeIndex}
                  onSelect={props.onSelect}
                  onSidebarCollapse={props.onSidebarCollapse}
                  onWriteResponse={props.onWriteResponse}
                />
              )}
            </For>
          </div>
          <div class="sticky bottom-0 bg-gradient-to-t from-white dark:from-slate-900 pt-14" />
        </div>

        {/* Summary section */}
        <SummarySidebar
          summary={props.summary}
          locale={props.locale}
          formMode={props.formMode}
          onShowBlank={props.onShowBlank}
          onShowError={props.onShowError}
          onShowRemark={props.onShowRemark}
          onSubmit={props.onSubmit}
        />
      </div>
    </Show>
  );
};

const SidebarHeader: Component<{
  acronym: string;
  templateVersion: string;
  validationVersion: string;
  clientMode: number;
}> = (props) => (
  <Show
    when={props.clientMode !== ClientMode.CAWI}
    fallback={
      <div
        class="text-lg block px-4 py-3 text-gray-600 dark:text-white font-bold sm:text-xl"
        innerHTML={props.acronym}
      />
    }
  >
    <div
      class="text-lg block px-4 py-3 text-gray-600 dark:text-white font-bold sm:text-xl"
      innerHTML={`${props.acronym}<div class="text-xs font-light text-gray-600 dark:text-gray-400">🚀${gearVersion} 📋${props.templateVersion} ✔️${props.validationVersion}</div>`}
    />
  </Show>
);

const SummarySidebar: Component<{
  summary: {
    answer: number;
    blank: number;
    error: number;
    remark: number;
  };
  locale: {
    summaryAnswer: string;
    summaryBlank: string;
    summaryError: string;
    summaryRemark: string;
  };
  formMode: number;
  onShowBlank: (e: MouseEvent) => void;
  onShowError: (e: MouseEvent) => void;
  onShowRemark: (e: MouseEvent) => void;
  onSubmit: (e: MouseEvent) => void;
}> = (props) => (
  <div class="h-2/6">
    <div class="bg-white px-8 p-5 w-full flex flex-col dark:bg-gray-900 space-y-4 absolute bottom-0 left-0">
      <div class="grid grid-cols-2 gap-y-4 sm:pb-3">
        <SummaryItem value={props.summary.answer} label={props.locale.summaryAnswer} />
        <SummaryItem
          value={props.summary.blank}
          label={props.locale.summaryBlank}
          onClick={props.onShowBlank}
        />
        <SummaryItem
          value={props.summary.error}
          label={props.locale.summaryError}
          onClick={props.onShowError}
        />
        <SummaryItem
          value={props.summary.remark}
          label={props.locale.summaryRemark}
          onClick={props.onShowRemark}
        />
      </div>
      <div>
        <Show when={props.summary.error === 0 && props.formMode === 1}>
          <button
            class="bg-teal-300 dark:bg-teal-500 hover:bg-teal-200 dark:hover:bg-teal-400 text-teal-100 p-3 w-full rounded-md shadow font-medium"
            onClick={props.onSubmit}
          >
            Submit
          </button>
        </Show>
        <Show when={props.summary.error > 0 && props.formMode < 3}>
          <button
            class="bg-red-500 hover:bg-red-400 text-teal-100 p-3 w-full rounded-md shadow font-medium"
            onClick={props.onShowError}
          >
            List Error
          </button>
        </Show>
      </div>
    </div>
  </div>
);

const SummaryItem: Component<{
  value: number;
  label: string;
  onClick?: (e: MouseEvent) => void;
}> = (props) => (
  <div
    class="h-auto text-5xl text-center sm:flex flex-col flex-coltext-white font-medium"
    classList={{ 'cursor-pointer': !!props.onClick }}
    onClick={props.onClick}
  >
    {props.value}
    <div class="font-light text-xs">{props.label}</div>
  </div>
);

export default FormSidebar;
