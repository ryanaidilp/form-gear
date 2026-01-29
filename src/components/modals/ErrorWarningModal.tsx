import { Component, For, Show } from 'solid-js';
import { closeModalWithAnimation, ModalClasses } from '../../utils';
import { ErrorIcon, WarningIcon, LookIntoIcon } from '../icons';
import type { ListItem } from './ListModal';

export interface ErrorWarningModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  errorItems: ListItem[];
  errorTotalItems: number;
  errorCurrentPage: number;
  errorMaxPage: number;
  onErrorPageChange: (page: number) => void;
  warningItems: ListItem[];
  warningTotalItems: number;
  warningCurrentPage: number;
  warningMaxPage: number;
  onWarningPageChange: (page: number) => void;
  onItemClick: (e: MouseEvent, sideIndex: number[], dataKey: string) => void;
}

const ErrorWarningModal: Component<ErrorWarningModalProps> = (props) => {
  const handleClose = () => {
    closeModalWithAnimation(ModalClasses.ERROR, props.setShow);
  };

  return (
    <Show when={props.show}>
      <div class="modal-confirmation modal-error fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={handleClose} />
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div class="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              {/* Error Section */}
              <ErrorWarningSection
                title="List Error"
                icon={<ErrorIcon />}
                iconBgClass="bg-red-200 text-red-500"
                items={props.errorItems}
                totalItems={props.errorTotalItems}
                currentPage={props.errorCurrentPage}
                maxPage={props.errorMaxPage}
                onPageChange={props.onErrorPageChange}
                onItemClick={props.onItemClick}
                messageColumnTitle="Error Messages"
              />

              {/* Warning Section */}
              <Show when={props.warningItems.length > 0}>
                <ErrorWarningSection
                  title="List Warning"
                  icon={<WarningIcon />}
                  iconBgClass="bg-yellow-200 text-yellow-500"
                  items={props.warningItems}
                  totalItems={props.warningTotalItems}
                  currentPage={props.warningCurrentPage}
                  maxPage={props.warningMaxPage}
                  onPageChange={props.onWarningPageChange}
                  onItemClick={props.onItemClick}
                  messageColumnTitle="Warning Messages"
                  isNested
                />
              </Show>
            </div>
            <div class="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

interface ErrorWarningSectionProps {
  title: string;
  icon: any;
  iconBgClass: string;
  items: ListItem[];
  totalItems: number;
  currentPage: number;
  maxPage: number;
  onPageChange: (page: number) => void;
  onItemClick: (e: MouseEvent, sideIndex: number[], dataKey: string) => void;
  messageColumnTitle: string;
  isNested?: boolean;
}

const PAGE_SIZE = 3;

const ErrorWarningSection: Component<ErrorWarningSectionProps> = (props) => {
  const getRowNumber = (index: number) => index + 1 + (props.currentPage * PAGE_SIZE - PAGE_SIZE);
  const total = () => props.totalItems || 0;
  const getStartItem = () => total() > 0 ? (props.currentPage - 1) * PAGE_SIZE + 1 : 0;
  const getEndItem = () => total() > 0 ? Math.min(props.currentPage * PAGE_SIZE, total()) : 0;

  const isFirstPage = () => props.currentPage === 1;
  const isLastPage = () => props.currentPage >= props.maxPage;
  const hasMultiplePages = () => props.maxPage > 1;

  return (
    <div class="sm:flex sm:items-start" classList={{ 'mt-6': props.isNested }}>
      <div class={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${props.iconBgClass}`}>
        {props.icon}
      </div>
      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          {props.title}
          <span class="text-sm font-normal text-gray-500 ml-2">
            ({getStartItem()}-{getEndItem()} of {total()})
          </span>
        </h3>
        <div class="relative overflow-auto">
          <div class="shadow-sm overflow-auto my-6">
            <table class="border-collapse table-fixed w-full text-sm">
              <thead class="text-sm font-semibold text-gray-600 bg-gray-50">
                <tr>
                  <th class="p-2 whitespace-nowrap font-semibold text-left w-1/12">No</th>
                  <th class="p-2 whitespace-nowrap font-semibold text-left w-4/12">Field</th>
                  <th class="p-2 whitespace-nowrap font-semibold text-left w-5/12">{props.messageColumnTitle}</th>
                  <th class="p-2 whitespace-nowrap font-semibold text-left w-2/12"></th>
                </tr>
              </thead>
              <tbody class="text-sm divide-y divide-gray-100">
                <For each={props.items}>
                  {(item, index) => (
                    <tr class="text-gray-600">
                      <td class="border-b border-slate-100 p-2 align-top">
                        <div class="text-left text-sm font-light">&nbsp;&nbsp;{getRowNumber(index())}</div>
                      </td>
                      <td class="border-b border-slate-100 p-2 align-top">
                        <div class="text-left text-sm font-light" innerHTML={item.label} />
                      </td>
                      <td class="border-b border-slate-100 align-top pb-2">
                        <For each={item.message}>
                          {(msg) => (
                            <div class="grid grid-cols-12 text-sm font-light mt-1">
                              <div class="col-span-1 flex justify-center items-start">-</div>
                              <div class="col-span-11 text-justify mr-1">{msg}</div>
                            </div>
                          )}
                        </For>
                      </td>
                      <td class="border-b border-slate-100 align-top p-2">
                        <button class="bg-transparent text-gray-500 rounded-full focus:outline-none h-5 w-5 hover:bg-gray-400 hover:text-white flex justify-center items-center"
                          onClick={(e) => props.onItemClick(e, item.sideIndex, item.dataKey)}>
                          <LookIntoIcon />
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
          <Show when={hasMultiplePages()}>
            <div class="flex justify-center items-center gap-2 py-3 border-t border-gray-100">
              {/* Prev Button */}
              <button
                type="button"
                class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
                onClick={() => props.onPageChange(props.currentPage - 1)}
                disabled={isFirstPage()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              {/* Page Indicator */}
              <div class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 font-medium">
                <span class="text-gray-900">{props.currentPage}</span>
                <span class="text-gray-400">/</span>
                <span class="text-gray-500">{props.maxPage}</span>
              </div>

              {/* Next Button */}
              <button
                type="button"
                class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
                onClick={() => props.onPageChange(props.currentPage + 1)}
                disabled={isLastPage()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default ErrorWarningModal;
