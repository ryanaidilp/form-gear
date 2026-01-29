import { Component, For, Show } from 'solid-js';
import { ClientMode } from '../../core/constants';
import ThemeToggle from './ThemeToggle';
import { MenuIcon } from '../icons';

export interface FormHeaderProps {
  template: any;
  config: any;
  onMobile: boolean;
  renderGear: string;
  timeDiff: number;
  onToggleTheme: () => void;
  onSidebarCollapse: (e: MouseEvent) => void;
  sidebar: any;
  form: any;
  onSelectTab: (dataKey: string, label: string, index: number[], position: number) => void;
}

const FormHeader: Component<FormHeaderProps> = (props) => (
  <div class="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 z-10 sticky"
    classList={{
      'top-0': props.config.clientMode !== ClientMode.PAPI,
      '-top-[121px]': props.config.clientMode === ClientMode.PAPI,
    }}>
    <div class="flex w-full items-center">
      <div class="ml-3 w-4/6 md:w-auto md:text-2xl md:text-left font-medium text-left text-base text-gray-900 dark:text-white mt-1">
        <div innerHTML={props.template.details.title} />
        <div class="text-sm font-light md:text-lg text-gray-600 dark:text-gray-400" innerHTML={props.template.details.description}
          classList={{ 'flex': !props.onMobile, 'hidden': props.onMobile }} />
        <Show when={props.config.clientMode === 2}>
          <div class="text-xs font-light text-gray-600">{props.renderGear} ± {props.timeDiff} ms</div>
        </Show>
      </div>
      <div class="ml-auto w-1/6 md:w-auto sm:flex items-center p-2">
        <ThemeToggle onToggle={props.onToggleTheme} />
      </div>
      <div class="ml-auto w-1/6 md:w-auto sm:flex md:hidden items-center">
        <button type="button" class="p-4 mobile-menu-button focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-800" onClick={props.onSidebarCollapse}>
          <MenuIcon />
        </button>
      </div>
    </div>
    <div class="flex items-center space-x-3 sm:mt-7 mt-4" />

    {/* PAPI Tab Navigation */}
    <Show when={props.config.clientMode === ClientMode.PAPI}>
      <div class="flex relative flex-none min-w-full px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
        <ul class="flex text-sm leading-6 text-slate-400 pt-4">
          <For each={props.sidebar.details}>
            {(item, index) => (
              <li class="flex-none" classList={{ 'border-b-4 border-blue-800': item.dataKey === props.form.activeComponent.dataKey }}>
                <a class="block py-2 mb-1.5 px-4 rounded font-medium space-x-2 hover:bg-blue-700 hover:text-white"
                  classList={{ 'bg-blue-800 text-white': item.dataKey === props.form.activeComponent.dataKey }}
                  href="javascript:void(0);"
                  onClick={() => props.onSelectTab(item.dataKey, item.label, item.index, index())}>
                  {item.label}
                </a>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  </div>
);

export default FormHeader;
