import { useEffect, useState } from 'react';

export function toast(message, title = 'Success.') {
  window.dispatchEvent(new CustomEvent('medflow-toast', { detail: { title, message } }));
}

export function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const id = Date.now() + Math.random();
      setItems((t) => [...t, { id, ...e.detail }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener('medflow-toast', onToast);
    return () => window.removeEventListener('medflow-toast', onToast);
  }, []);
  return (
    <>
      {items.map((t, i) => (
        <div className="toast" key={t.id} style={{ bottom: 26 + i * 66 }}>
          <b>✓ {t.title}</b>
          <span>{t.message}</span>
          <button className="x" onClick={() => setItems((x) => x.filter((y) => y.id !== t.id))}>✕</button>
        </div>
      ))}
    </>
  );
}
