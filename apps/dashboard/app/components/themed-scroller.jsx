export default function ThemedScroller({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag
      className={[
        "themed-scroller",
        "overflow-y-auto overflow-x-hidden",
        "scrollbar-thin",
        "scrollbar-thumb-[var(--scrollbar-thumb)]",
        "scrollbar-track-[var(--scrollbar-track)]",
        "hover:scrollbar-thumb-[var(--scrollbar-thumb-hover)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
}
