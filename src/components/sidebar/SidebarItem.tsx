import { Component, For, Show } from 'solid-js';
import { isMobileDevice, resetScrollPosition } from '../../utils';

export interface SidebarDetail {
  dataKey: string;
  label: string;
  description?: string;
  index: number[];
  level: number;
  enable: boolean;
  components?: unknown[][];
}

export interface SidebarItemProps {
  item: SidebarDetail;
  allItems: SidebarDetail[];
  activeDataKey: string;
  activeIndex: number[];
  onSelect: (dataKey: string, label: string, index: number[], position: number) => void;
  onSidebarCollapse: (e: MouseEvent) => void;
  onWriteResponse: () => void;
}

/**
 * Recursive sidebar item component that handles nested levels (0-3).
 */
const SidebarItem: Component<SidebarItemProps> = (props) => {
  const handleClick = (e: MouseEvent, item: SidebarDetail, position: number) => {
    resetScrollPosition();
    if (isMobileDevice()) {
      props.onSidebarCollapse(e);
    }
    props.onWriteResponse();
    props.onSelect(item.dataKey, item.label, JSON.parse(JSON.stringify(item.index)), position);
  };

  const getPosition = (item: SidebarDetail) => {
    return props.allItems.findIndex((i) => i.dataKey === item.dataKey);
  };

  const isActive = (item: SidebarDetail) => item.dataKey === props.activeDataKey;

  const getChildItems = (parentItem: SidebarDetail, targetLevel: number) => {
    return props.allItems.filter((child) => {
      if (child.level !== targetLevel || !child.enable) return false;

      switch (targetLevel) {
        case 1:
          return parentItem.index[1] === child.index[1];
        case 2:
          return (
            parentItem.index[1] === child.index[1] &&
            parentItem.index[3] === child.index[3] &&
            parentItem.index[4] === child.index[4]
          );
        case 3:
          return (
            parentItem.index[1] === child.index[1] &&
            parentItem.index[3] === child.index[3] &&
            parentItem.index[5] === child.index[5] &&
            parentItem.index[6] === child.index[6]
          );
        default:
          return false;
      }
    });
  };

  const renderItem = (item: SidebarDetail, level: number) => (
    <>
      <a
        class="block py-2 px-4 rounded font-medium space-x-2 hover:bg-blue-700 hover:text-white"
        classList={{ 'bg-blue-800 text-white': isActive(item) }}
        href="javascript:void(0);"
        onClick={(e) => handleClick(e, item, getPosition(item))}
      >
        {item.label}
        <Show when={item.description}>
          <div class="font-light text-xs">
            <div innerHTML={item.description} />
          </div>
        </Show>
      </a>

      <Show when={level < 3}>
        <For each={getChildItems(item, level + 1)}>
          {(child) => (
            <ul
              class="border-l border-gray-300 dark:border-slate-500 ml-4"
              classList={{ show: props.item.index[1] === props.activeIndex[1] }}
            >
              <li>{renderItem(child, level + 1)}</li>
            </ul>
          )}
        </For>
      </Show>
    </>
  );

  return (
    <Show when={props.item.level === 0 && props.item.enable}>
      <ul class="formgear-sidebar">
        <li>{renderItem(props.item, 0)}</li>
      </ul>
    </Show>
  );
};

export default SidebarItem;
