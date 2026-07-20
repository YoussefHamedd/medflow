/* Auth-page illustrations.
   If the real artwork files exist in client/public/ they are used:
     /signup-illustration.png  → Sign up page
     /login-illustration.png   → Login page
   Otherwise the drawn SVG stand-ins below are shown. */

import { useState } from 'react';

function IllustrationImage({ src, Fallback, maxWidth }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback />;
  return (
    <img
      src={src}
      alt=""
      style={{ maxWidth, width: '100%', height: 'auto', borderRadius: 16 }}
      onError={() => setFailed(true)}
    />
  );
}

export function SignupArt() {
  return <IllustrationImage src="/signup-illustration.png" Fallback={SignupIllustration} maxWidth={440} />;
}

export function LoginArt() {
  return <IllustrationImage src="/login-illustration.png" Fallback={LoginIllustration} maxWidth={420} />;
}

export function SignupIllustration() {
  return (
    <svg width="420" height="380" viewBox="0 0 420 380" fill="none">
      <g opacity="0.35" stroke="#bfe8d2">
        {Array.from({ length: 10 }).map((_, r) =>
          Array.from({ length: 12 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={20 + c * 35} cy={20 + r * 38} r="1.6" fill="#bfe8d2" stroke="none" />
          ))
        )}
      </g>
      {/* ground */}
      <ellipse cx="210" cy="320" rx="150" ry="26" fill="#dff3e7" />
      {/* big cross block */}
      <rect x="170" y="250" width="80" height="80" rx="12" fill="#57c690" />
      <path d="M210 268v44M188 290h44" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
      {/* patient figure */}
      <circle cx="150" cy="170" r="22" fill="#f2b9a0" />
      <path d="M128 168c0-16 10-28 22-28s22 12 22 28" fill="#5b4a3f" />
      <rect x="126" y="192" width="48" height="70" rx="18" fill="#3fa470" />
      <rect x="128" y="258" width="18" height="58" rx="8" fill="#e07a4f" />
      <rect x="154" y="258" width="18" height="58" rx="8" fill="#e07a4f" />
      {/* doctor figure */}
      <circle cx="280" cy="150" r="18" fill="#f2c9a0" />
      <path d="M264 146c0-11 7-19 16-19s16 8 16 19" fill="#3c3c3c" />
      <rect x="260" y="168" width="40" height="66" rx="14" fill="#ffffff" stroke="#d8e8de" />
      <rect x="270" y="176" width="20" height="34" rx="4" fill="#57c690" opacity="0.4" />
      <rect x="262" y="232" width="14" height="52" rx="6" fill="#3c5a4c" />
      <rect x="284" y="232" width="14" height="52" rx="6" fill="#3c5a4c" />
      {/* clipboard */}
      <rect x="300" y="120" width="58" height="76" rx="8" fill="#fff" stroke="#cde7d8" />
      <rect x="318" y="112" width="22" height="12" rx="4" fill="#57c690" />
      <path d="M310 140h38M310 154h38M310 168h24" stroke="#9fd8ba" strokeWidth="5" strokeLinecap="round" />
      <path d="M308 186l6 6 12-14" stroke="#41b57e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* heart */}
      <path d="M92 116c-8-9-24-4-24 8 0 10 12 17 24 26 12-9 24-16 24-26 0-12-16-17-24-8z" fill="#4dc487" />
      <path d="M76 128h10l4-8 6 14 5-8h11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* check badge */}
      <circle cx="86" cy="240" r="16" fill="#fff" stroke="#4dc487" strokeWidth="3" />
      <path d="m79 240 5 5 10-11" stroke="#4dc487" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LoginIllustration() {
  return (
    <svg width="440" height="380" viewBox="0 0 440 380" fill="none">
      <g opacity="0.35">
        {Array.from({ length: 10 }).map((_, r) =>
          Array.from({ length: 13 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={16 + c * 34} cy={16 + r * 38} r="1.6" fill="#bfe8d2" />
          ))
        )}
      </g>
      <ellipse cx="220" cy="322" rx="170" ry="30" fill="#dff3e7" />
      <rect x="188" y="266" width="64" height="64" rx="10" fill="#57c690" />
      <path d="M220 280v36M202 298h36" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      {/* team of medics: five simple figures */}
      {[
        { x: 90, top: '#3fa470', skin: '#f2b9a0', hair: '#5b4a3f' },
        { x: 150, top: '#ffffff', skin: '#f2c9a0', hair: '#3c3c3c' },
        { x: 220, top: '#4db6ac', skin: '#e8a687', hair: '#242424' },
        { x: 290, top: '#ffffff', skin: '#f2b9a0', hair: '#6b4f3a' },
        { x: 348, top: '#3fa470', skin: '#f2c9a0', hair: '#2f2f2f' },
      ].map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={170 - (i % 2) * 16} r="17" fill={f.skin} />
          <path
            d={`M${f.x - 15} ${166 - (i % 2) * 16}c0-11 7-19 15-19s15 8 15 19`}
            fill={f.hair}
          />
          <rect
            x={f.x - 20}
            y={188 - (i % 2) * 16}
            width="40"
            height="62"
            rx="14"
            fill={f.top}
            stroke={f.top === '#ffffff' ? '#d8e8de' : 'none'}
          />
          <rect x={f.x - 17} y={248 - (i % 2) * 16} width="13" height="52" rx="6" fill="#3c5a4c" />
          <rect x={f.x + 4} y={248 - (i % 2) * 16} width="13" height="52" rx="6" fill="#3c5a4c" />
        </g>
      ))}
      {/* stethoscope accent */}
      <path d="M120 210c0 18 14 30 30 30" stroke="#2f8f63" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="154" cy="241" r="6" fill="#2f8f63" />
    </svg>
  );
}
