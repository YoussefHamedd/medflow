import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '../icons.jsx';

export function useDark() {
  const [dark, setDark] = useState(() => localStorage.getItem('medflow_dark') === '1');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('medflow_dark', dark ? '1' : '0');
  }, [dark]);
  return [dark, () => setDark((d) => !d)];
}

export default function ThemeToggle({ style }) {
  const [dark, toggle] = useDark();
  return (
    <button className="icon-btn" title="Toggle dark mode" style={style} onClick={toggle}>
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}
