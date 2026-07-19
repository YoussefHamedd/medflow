import { useMemo, useState } from 'react';
import { SearchIcon, ChevronDown } from '../icons.jsx';
import Dropdown from './Dropdown.jsx';

/**
 * columns: [{ key, label, render?(row), sortValue?(row), hideable=true }]
 * filters: extra toolbar nodes (dropdowns, buttons)
 */
export default function DataTable({
  columns,
  rows,
  searchPlaceholder = 'Search by name...',
  searchFn,
  filters = null,
  actions = null,
  countLabel = 'users',
  emptyText = 'No data yet.',
}) {
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(() => new Set(columns.map((c) => c.key)));
  const [sortKey, setSortKey] = useState(columns[0]?.key);
  const [sortDir, setSortDir] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);

  const shown = columns.filter((c) => visible.has(c.key));

  const filtered = useMemo(() => {
    let out = rows;
    if (search && searchFn) out = out.filter((r) => searchFn(r, search.toLowerCase()));
    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      const sv = col.sortValue || ((r) => r[col.key]);
      out = [...out].sort((a, b) => {
        const va = sv(a), vb = sv(b);
        return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
      });
    }
    return out;
  }, [rows, search, sortKey, sortDir, columns, searchFn]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const cur = Math.min(page, pages - 1);
  const pageRows = filtered.slice(cur * perPage, cur * perPage + perPage);

  return (
    <div>
      <div className="toolbar">
        <div className="search-box">
          <SearchIcon size={15} />
          <input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        {filters}
        <Dropdown label="Columns">
          {columns.map((c) => (
            <button
              key={c.key}
              className="item"
              onClick={(e) => {
                e.stopPropagation();
                setVisible((v) => {
                  const n = new Set(v);
                  n.has(c.key) ? n.delete(c.key) : n.add(c.key);
                  return n;
                });
              }}
            >
              <input type="checkbox" readOnly checked={visible.has(c.key)} /> {c.label}
            </button>
          ))}
        </Dropdown>
        {actions}
      </div>

      <div className="table-meta">
        <span>Total {filtered.length} {countLabel}</span>
        <span>
          Rows per page:{' '}
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
            style={{ border: 'none', background: 'transparent', color: 'inherit' }}
          >
            {[5, 10, 25].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </span>
      </div>

      <div className="card-table">
        <table className="data">
          <thead>
            <tr>
              {shown.map((c) => (
                <th
                  key={c.key}
                  onClick={() => {
                    if (sortKey === c.key) setSortDir((d) => -d);
                    else { setSortKey(c.key); setSortDir(1); }
                  }}
                >
                  {c.label} {sortKey === c.key ? (sortDir === 1 ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={shown.length}><div className="empty-note">{emptyText}</div></td></tr>
            )}
            {pageRows.map((row, i) => (
              <tr key={row.id ?? i}>
                {shown.map((c) => (
                  <td key={c.key} className={c.key === 'actions' ? 'actions-cell' : ''}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>0 of {filtered.length} selected</span>
        <div className="pager">
          <button className="arrow" disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹</button>
          <button className="page-num">{cur + 1}</button>
          <button className="arrow" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>›</button>
        </div>
      </div>
    </div>
  );
}
