import { useState, useMemo } from 'react';

export default function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  // Reset to page 1 whenever items change length (filter/search)
  const reset = () => setPage(1);

  return { paged, page: safePage, totalPages, setPage, reset };
}
