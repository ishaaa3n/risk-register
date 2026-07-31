const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const ClipboardIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M9 11h6M9 15h6" />
  </svg>
);

export const AlertTriangleIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 21 20H3L12 3.5Z" />
    <path d="M12 9.5v4.5" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const ShieldAlertIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z" />
    <path d="M12 8.5v4" />
    <circle cx="12" cy="15.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const TrendingDownIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 7l7 7 4-4 7 7" />
    <path d="M21 12v5h-5" />
  </svg>
);

export const SearchIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const Building2Icon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
    <path d="M15 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
    <path d="M7 7h1M10 7h1M7 11h1M10 11h1M7 15h1M10 15h1" />
    <path d="M2 21h20" />
  </svg>
);

export const TriangleAlertIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M12 3.5 21 20H3L12 3.5Z" />
    <path d="M12 9.5v4.5" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const EditIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const TrashIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const ClipboardCheckIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="m9.5 13 2 2 3.5-3.5" />
  </svg>
);
