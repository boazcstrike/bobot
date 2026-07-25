// Dotted rule used between dashboard grid bands.
export default function Divider({ className = "" }) {
  return (
    <div className={`relative h-4 overflow-hidden border-border bg-background ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at center, currentColor 1px, transparent 0)",
          backgroundSize: "12px 12px",
          backgroundPosition: "6px 6px",
          color: "var(--foreground)",
          opacity: 0.25,
          maskImage: "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
        }}
      />
    </div>
  );
}
