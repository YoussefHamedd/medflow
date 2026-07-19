import { useEffect, useRef, useState } from 'react';
import { KebabIcon } from '../icons.jsx';

export default function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="kebab" onClick={() => setOpen((o) => !o)}><KebabIcon size={16} /></button>
      {open && (
        <div className="dropdown-menu" style={{ right: 0 }} onClick={() => setOpen(false)}>
          {items.map(({ label, icon, onClick, danger }) => (
            <button key={label} className="item" style={danger ? { color: 'var(--danger)' } : undefined} onClick={onClick}>
              {icon} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
