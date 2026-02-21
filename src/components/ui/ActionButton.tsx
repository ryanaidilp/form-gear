import { JSX, splitProps } from "solid-js";

type Color = 'pink' | 'teal' | 'sky' | 'amber' | 'fuchsia';

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: Color;
};

const hoverClasses: Record<Color, string> = {
  pink:    'hover:bg-pink-200    hover:text-pink-400    hover:border-pink-200',
  teal:    'hover:bg-teal-200    hover:text-teal-400    hover:border-teal-200',
  sky:     'hover:bg-sky-200     hover:text-sky-400     hover:border-sky-200',
  amber:   'hover:bg-amber-100   hover:text-amber-400   hover:border-amber-100',
  fuchsia: 'hover:bg-fuchsia-200 hover:text-fuchsia-400 hover:border-fuchsia-200',
};

const ActionButton = (props: Props) => {
  const [local, rest] = splitProps(props, ['color', 'class', 'children']);

  return (
    <button
      type="button"
      class={[
        'bg-white dark:bg-gray-800 text-gray-500 p-2 rounded-full focus:outline-none',
        'h-10 w-10 border-2 border-gray-300',
        'disabled:bg-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-400',
        hoverClasses[local.color ?? 'pink'],
        local.class ?? '',
      ].join(' ')}
      {...rest}
    >
      {local.children}
    </button>
  );
};

export default ActionButton;
