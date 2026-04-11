import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  const links = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Templates", href: "/templates" },
      { label: "Marketplace", href: "/marketplace" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
    Resources: [
      { label: "Help Center", href: "/help" },
      { label: "API Docs", href: "/docs" },
      { label: "Affiliate Program", href: "/affiliate" },
      { label: "Community", href: "/community" },
    ],
    "Free Tools": [
      { label: "Hook Generator", href: "/tools/hook-generator" },
    ],
    Legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  };

  return (
    <footer className="border-t border-black/5 bg-white px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <span className="font-heading text-xl font-bold text-text-primary">
                Famousli
              </span>
            </Link>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              AI-powered ad creation for every small business. From New York to Nairobi, Paris to Mumbai.
            </p>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-heading font-bold text-text-primary mb-4">{section}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 md:flex-row">
          <p className="text-sm text-text-secondary">
            © {year} Famousli. All rights reserved.
          </p>
          <p className="text-sm text-text-secondary">
            Made with <span className="text-danger">♥</span> for small businesses worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
