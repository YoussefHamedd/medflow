export default function Logo({ size = 64, withText = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <img src="/logo.svg" alt="MedFlow" style={{ width: size, height: 'auto' }} />
      {withText && (
        <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2cc2b5', fontWeight: 700 }}>
          MEDFLOW
        </div>
      )}
    </div>
  );
}
