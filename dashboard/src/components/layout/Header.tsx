// Header is a server component — no interactivity needed here.
// Matches the "mast" pattern from stricker-capital.de:
// sticky, backdrop-blur, brand mark (W circle), app title, right-side slot.

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-card border-b border-line"
      style={{
        minHeight: "70px",
        backgroundColor: "var(--mast)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Left: brand mark + app name */}
      <div className="flex items-center gap-3">
        <BrandMark />
        <div className="flex flex-col">
          <span className="font-serif text-ink text-base leading-tight">CFO Dashboard</span>
          <span className="label" style={{ fontSize: "9px" }}>powered by AI</span>
        </div>
      </div>

      {/* Right: placeholder for user menu / theme toggle (added later) */}
      <div className="flex items-center gap-3">
        <span className="label">Beta</span>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <div
      className="flex items-center justify-center bg-accent text-white font-serif font-bold"
      style={{ width: 29, height: 29, fontSize: 17 }}
    >
      W
    </div>
  );
}
