import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

/* ─────────────────────────────────────────────────────────────
   OFFICIAL & PREMIUM BANK LOGOS (SVG)
   ───────────────────────────────────────────────────────────── */

export function SBILogo({ size = 32, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <circle cx="24" cy="24" r="22" fill="#00539F" />
      <circle cx="24" cy="20" r="7.5" fill="#FFFFFF" />
      <rect x="21" y="20" width="6" height="18" rx="1.5" fill="#00539F" />
      <rect x="22" y="24" width="4" height="14" fill="#00539F" />
    </svg>
  );
}

export function HDFCLogo({ size = 32, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <rect width="48" height="48" rx="8" fill="#004C8F" />
      {/* Red border block */}
      <rect x="8" y="8" width="32" height="32" rx="4" fill="#ED232A" />
      {/* White cross overlay */}
      <rect x="18" y="8" width="12" height="32" fill="#FFFFFF" />
      <rect x="8" y="18" width="32" height="12" fill="#FFFFFF" />
      {/* Center red box */}
      <rect x="18" y="18" width="12" height="12" fill="#004C8F" />
      <rect x="20" y="20" width="8" height="8" fill="#ED232A" />
    </svg>
  );
}

export function ICICILogo({ size = 32, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <rect width="48" height="48" rx="8" fill="#A41D23" />
      <circle cx="24" cy="14" r="5" fill="#F37023" />
      <path
        d="M24 22C17.3726 22 12 27.3726 12 34H18C18 30.6863 20.6863 28 24 28C27.3137 28 30 30.6863 30 34H36C36 27.3726 30.6274 22 24 22Z"
        fill="#F37023"
      />
      <rect x="21" y="24" width="6" height="14" rx="3" fill="#FFFFFF" />
    </svg>
  );
}

export function BOBLogo({ size = 32, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <rect width="48" height="48" rx="8" fill="#F26522" />
      {/* Dual B Sun emblem */}
      <circle cx="24" cy="24" r="16" fill="#FFFFFF" opacity="0.2" />
      <path
        d="M16 14H26C29.3137 14 32 16.6863 32 20C32 21.8 31.2 23.4 30 24.3C31.8 25.4 33 27.5 33 30C33 34.4183 29.4183 38 25 38H16V14ZM21 23H25C26.6569 23 28 21.6569 28 20C28 18.3431 26.6569 17 25 17H21V23ZM21 34H25.5C27.9853 34 30 31.9853 30 29.5C30 27.0147 27.9853 25 25.5 25H21V34Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   ENTERPRISE FINTECH & REGULATORY ICONS
   ───────────────────────────────────────────────────────────── */

export function ShieldIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function LockIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = "#00a859", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function BanIcon({ size = 20, color = "#e11d48", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function BrainIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.96-.44" />
      <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08 2.5 2.5 0 0 1-4.96-.44" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="7" y1="14" x2="17" y2="14" />
    </svg>
  );
}

export function HandshakeIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l6.6-6.6a2 2 0 0 0 0-2.8l-2.6-2.6a2 2 0 0 0-2.8 0L13 9.6" />
      <path d="m13 17-2-2a1 1 0 0 0-1.4 0L3 21.6a2 2 0 0 0 0 2.8l2.6 2.6a2 2 0 0 0 2.8 0l2.6-2.6" />
      <path d="m14 8 2.5-2.5a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L9 4.6" />
      <path d="M6 12 3.5 9.5a2 2 0 0 1 0-2.8L4.9 5.3a2 2 0 0 1 2.8 0L10 7.6" />
    </svg>
  );
}

export function IdCardIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M14 9h4" />
      <path d="M14 13h3" />
      <path d="M5 16a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function BuildingBankIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="12 3 2 10 22 10" />
      <line x1="5" y1="10" x2="5" y2="21" />
      <line x1="10" y1="10" x2="10" y2="21" />
      <line x1="14" y1="10" x2="14" y2="21" />
      <line x1="19" y1="10" x2="19" y2="21" />
    </svg>
  );
}

export function MessageSquareIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function MicIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export function VolumeIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function TrendingUpIcon({ size = 20, color = "#00a859", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function TrendingDownIcon({ size = 20, color = "#e11d48", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

export function FileTextIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

export function SparklesIcon({ size = 20, color = "#94f84a", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 20, color = "#d97706", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function InfoIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function RefreshCwIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M3 12a9 9 0 0 1 15.55-5.55L21 9" />
      <path d="M21 3v6h-6" />
      <path d="M21 12a9 9 0 0 1-15.55 5.55L3 15" />
      <path d="M3 21v-6h6" />
    </svg>
  );
}

export function SettingsIcon({ size = 20, color = "currentColor", className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

