import { PersonIcon } from '../icons.jsx';

export default function Avatar({ user, size = 36 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'var(--surface-2)',
  };
  if (user?.avatar) {
    return (
      <div style={style}>
        <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{ ...style, color: '#8b9390' }}>
      <PersonIcon size={size * 0.62} aria-label="Default profile" />
    </div>
  );
}
