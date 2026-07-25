import Link from "next/link";

const FOOTER_LINKS = [
  { title: "Expenses", href: "/expenses" },
  { title: "Statements", href: "/credit-card-statements" },
  { title: "Repos", href: "/personal-github-repos" },
];

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row">
      <p className="text-sm text-muted-foreground">
        Bobot Control Deck — personal assistant dashboard.
      </p>

      <div className="flex gap-4">
        {FOOTER_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
