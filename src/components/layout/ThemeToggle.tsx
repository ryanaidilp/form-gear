import { Component } from 'solid-js';
import { SunIcon, MoonIcon } from '../icons';

export interface ThemeToggleProps {
  onToggle: () => void;
}

const ThemeToggle: Component<ThemeToggleProps> = (props) => (
  <button onClick={props.onToggle} type="button"
    class="button-switch relative inline-flex flex-shrink-0 bg-gray-200 dark:bg-gray-700 h-6 w-11 border-2 border-transparent rounded-full cusrsor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
    <span class="outer-span relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 pointer-events-none">
      <span class="light-switch absolute inset-0 h-full w-full flex items-center justify-center transition-opacity opacity-100 dark:opacity-0 ease-out duration-100">
        <SunIcon />
      </span>
      <span class="dark-switch absolute inset-0 h-full w-full flex items-center justify-center transition-opacity opacity-0 dark:opacity-100 ease-in duration-200">
        <MoonIcon />
      </span>
    </span>
  </button>
);

export default ThemeToggle;
