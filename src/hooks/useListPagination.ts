import { createSignal, Accessor } from 'solid-js';

export interface ListPaginationState<T> {
  items: Accessor<T[]>;
  pageItems: Accessor<T[]>;
  totalItems: Accessor<number>;
  currentPage: Accessor<number>;
  maxPage: Accessor<number>;
  setItems: (items: T[]) => void;
  setPage: (page: number) => void;
}

const DEFAULT_PAGE_SIZE = 3;

/**
 * Hook for managing paginated list state.
 * Reduces boilerplate for error, warning, blank, and remark lists.
 */
export function useListPagination<T>(pageSize = DEFAULT_PAGE_SIZE): ListPaginationState<T> {
  const [items, setItemsInternal] = createSignal<T[]>([]);
  const [pageItems, setPageItems] = createSignal<T[]>([]);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [maxPage, setMaxPage] = createSignal(1);

  const calculatePage = (allItems: T[], page: number) => {
    const total = allItems.length;
    const max = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), max);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    return {
      pageItems: allItems.slice(start, end),
      currentPage: safePage,
      maxPage: max,
    };
  };

  const setItems = (newItems: T[]) => {
    setItemsInternal(newItems);
    const result = calculatePage(newItems, 1);
    setPageItems(result.pageItems);
    setCurrentPage(result.currentPage);
    setMaxPage(result.maxPage);
  };

  const setPage = (page: number) => {
    const allItems = items();
    const result = calculatePage(allItems, page);
    setPageItems(result.pageItems);
    setCurrentPage(result.currentPage);
  };

  const totalItems = () => items().length;

  return {
    items,
    pageItems,
    totalItems,
    currentPage,
    maxPage,
    setItems,
    setPage,
  };
}
