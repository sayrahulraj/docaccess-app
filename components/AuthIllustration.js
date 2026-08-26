// Line-art illustration used on the dark side panel of the auth screens.
// Two variants share the same visual language as the reference design
// (rounded outlines, teal accent circle) but are original artwork.
export default function AuthIllustration({ variant = "login" }) {
  if (variant === "signup") {
    return (
      <svg viewBox="0 0 200 200" className="h-40 w-40" fill="none">
        <rect x="46" y="34" width="86" height="118" rx="10" stroke="white" strokeWidth="3" />
        <rect x="66" y="24" width="86" height="118" rx="10" fill="#1FBFA8" stroke="white" strokeWidth="3" />
        <line x1="82" y1="52" x2="136" y2="52" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="70" x2="136" y2="70" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="88" x2="118" y2="88" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="140" cy="128" r="26" fill="#0B1B2B" stroke="#1FBFA8" strokeWidth="3" />
        <path d="M129 128l8 8 16-16" stroke="#1FBFA8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // login variant: a locked document, signalling secure access
  return (
    <svg viewBox="0 0 200 200" className="h-40 w-40" fill="none">
      <rect x="52" y="30" width="86" height="118" rx="10" stroke="white" strokeWidth="3" />
      <line x1="68" y1="56" x2="122" y2="56" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="68" y1="74" x2="122" y2="74" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="68" y1="92" x2="100" y2="92" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <g>
        <circle cx="130" cy="132" r="34" fill="#1FBFA8" />
        <rect x="115" y="128" width="30" height="22" rx="4" stroke="#0B1B2B" strokeWidth="3" />
        <path d="M120 128v-8a10 10 0 0 1 20 0v8" stroke="#0B1B2B" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
