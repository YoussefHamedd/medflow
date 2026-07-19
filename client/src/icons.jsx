const I = ({ children, size = 16, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

export const HomeIcon = (p) => (
  <I {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></I>
);
export const ClockIcon = (p) => (
  <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>
);
export const FileIcon = (p) => (
  <I {...p}><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4" /></I>
);
export const BriefcaseIcon = (p) => (
  <I {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></I>
);
export const ChatIcon = (p) => (
  <I {...p}><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" /></I>
);
export const BotIcon = (p) => (
  <I {...p}><rect x="5" y="8" width="14" height="11" rx="2" /><path d="M12 8V4" /><circle cx="12" cy="3" r="1" /><path d="M9 13h.01M15 13h.01" /></I>
);
export const UsersIcon = (p) => (
  <I {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17.5 14.5c2 .6 3.5 2.4 3.5 4.5" /></I>
);
export const MoonIcon = (p) => (
  <I {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" fill="currentColor" stroke="none" /></I>
);
export const SunIcon = (p) => (
  <I {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></I>
);
export const PersonIcon = (p) => (
  <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></I>
);
export const SearchIcon = (p) => (
  <I {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></I>
);
export const ChevronDown = (p) => <I {...p}><path d="m6 9 6 6 6-6" /></I>;
export const PlusIcon = (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const KebabIcon = (p) => (
  <I {...p}><circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" /></I>
);
export const EyeIcon = (p) => (
  <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></I>
);
export const DownloadIcon = (p) => (
  <I {...p}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></I>
);
export const EditIcon = (p) => (
  <I {...p}><path d="M4 20h4L20 8l-4-4L4 16v4z" /></I>
);
export const TrashIcon = (p) => (
  <I {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /></I>
);
export const ArrowRight = (p) => <I {...p}><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></I>;
export const VideoIcon = (p) => (
  <I {...p}><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" /></I>
);
export const BackIcon = (p) => <I {...p}><path d="M20 12H4" /><path d="m10 18-6-6 6-6" /></I>;
export const MedkitIcon = (p) => (
  <I {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M12 11v5M9.5 13.5h5" /></I>
);
export const HandPlusIcon = (p) => (
  <I {...p}><path d="M4 16c2-3 5-3 8-2l5 1.5" /><path d="M4 20h16" /><path d="M15 5v6M12 8h6" /></I>
);
export const ChatPlusIcon = (p) => (
  <I {...p}><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" /><path d="M12 8v6M9 11h6" /></I>
);

/* Solid (filled) icons for the dashboard stat cards */
const S = ({ children, size = 32, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>{children}</svg>
);
export const MedkitSolid = (p) => (
  <S {...p}>
    <path d="M9 4a2 2 0 0 0-2 2v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a2 2 0 0 0-2-2H9zm0 2h6v1H9V6zm2 5h2v2.5h2.5v2H13V18h-2v-2.5H8.5v-2H11V11z" />
  </S>
);
export const PersonPlusSolid = (p) => (
  <S {...p}>
    <circle cx="10" cy="8" r="4" />
    <path d="M2 20c.7-4 4-6 8-6s7.3 2 8 6H2z" />
    <path d="M17 4h2v2.5h2.5v2H19V11h-2V8.5h-2.5v-2H17V4z" />
  </S>
);
export const DocPlusSolid = (p) => (
  <S {...p}>
    <path d="M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-6-6H7zm5 1.5L17.5 9H12V3.5zM11 12h2v2.5h2.5v2H13V19h-2v-2.5H8.5v-2H11V12z" />
  </S>
);
export const HandPlusSolid = (p) => (
  <S {...p}>
    <path d="M3 18c2.5-3.2 6-3.4 9.4-2.3l5.2 1.6c.9.3 1.4 1.1 1.1 2L3 19.5V18z" />
    <path d="M15 3h2v2.5h2.5v2H17V10h-2V7.5h-2.5v-2H15V3z" />
    <rect x="2" y="20.5" width="20" height="1.8" rx="0.9" />
  </S>
);
export const ChatPlusSolid = (p) => (
  <S {...p}>
    <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9H3l2.2-3.3A9 9 0 0 1 12 3zm-1 5v3H8v2h3v3h2v-3h3v-2h-3V8h-2z" />
  </S>
);
