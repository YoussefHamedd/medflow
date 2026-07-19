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
  // gray silhouette placeholder, like the reference app
  return (
    <div style={style}>
      <svg width={size} height={size} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#e6e8e7" />
        <circle cx="20" cy="15" r="7" fill="#8b9390" />
        <path d="M6 38c1.5-8 7-12 14-12s12.5 4 14 12" fill="#8b9390" />
      </svg>
    </div>
  );
}
