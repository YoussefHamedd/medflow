import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from '../icons.jsx';

export default function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="dropdown-btn" onClick={() => setOpen((o) => !o)}>
        {label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown-menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
