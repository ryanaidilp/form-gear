import { Component } from 'solid-js';

const FormConfigError: Component = () => (
  <div class="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
    <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
      <svg class="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Form Configuration Error</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">No sections found in the template. Please ensure your template JSON has at least one section with type 1.</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Check the browser console for more details.</p>
    </div>
  </div>
);

export default FormConfigError;
