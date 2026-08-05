import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './Pagination.css';

export default function Pagination({ page, totalPages, onPage, total, pageSize }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="pagination">
      <span className="pagination__info">{from}–{to} of {total}</span>
      <div className="pagination__controls">
        <button className="pagination__btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} className="pagination__ellipsis">…</span>
            : <button key={p} className={`pagination__btn${p === page ? ' active' : ''}`} onClick={() => onPage(p)}>{p}</button>
        )}
        <button className="pagination__btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}
