import { JSX, Show, splitProps } from "solid-js";

type Props = {
  disabled?: boolean;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  comments?: number;
  class?: string;
};

const RemarkButton = (props: Props) => {
  const [local, rest] = splitProps(props, ['comments', 'class']);

  return (
    <button
      type="button"
      class={[
        'relative inline-block bg-white dark:bg-gray-800 p-2 h-10 w-10 text-gray-500 rounded-full',
        'hover:bg-yellow-100 hover:text-yellow-400 hover:border-yellow-100',
        'border-2 border-gray-300',
        'disabled:bg-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-400',
        local.class ?? '',
      ].join(' ')}
      {...rest}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <Show when={local.comments && local.comments > 0}>
        <span class="absolute top-0 right-0 inline-flex items-center justify-center h-6 w-6 text-xs font-semibold text-white transform translate-x-1/2 -translate-y-1/4 bg-pink-600/80 rounded-full">
          {local.comments}
        </span>
      </Show>
    </button>
  );
};

export default RemarkButton;
