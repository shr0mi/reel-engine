import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  slug: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "CoolCaptions", slug: "/cool-captions/transcribe" },
  { label: "Text2Reel", slug: "/text-to-reel" },
  { label: "ProductAds", slug: "/" },
  { label: "Mister_Memer", slug: "/mister-memer/generate" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [barStyle, setBarStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const location = useLocation();

  const activeSlug =
    NAV_LINKS.find(
      (l) => l.slug !== "/" && location.pathname.startsWith(l.slug),
    )?.slug ?? (location.pathname === "/" ? "/" : null);

  const targetSlug = hoveredSlug ?? activeSlug;

  useEffect(() => {
    if (!targetSlug) {
      setPillStyle((s) => ({ ...s, opacity: 0 }));
      return;
    }
    const el = linkRefs.current[targetSlug];
    const nav = navRef.current;
    if (!el || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPillStyle({
      left: elRect.left - navRect.left,
      width: elRect.width,
      opacity: 1,
    });
  }, [targetSlug, location.pathname]);

  // Bar tracks only the active slug (not hover)
  useEffect(() => {
    if (!activeSlug) {
      setBarStyle((s) => ({ ...s, opacity: 0 }));
      return;
    }
    const el = linkRefs.current[activeSlug];
    const nav = navRef.current;
    if (!el || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setBarStyle({
      left: elRect.left - navRect.left,
      width: elRect.width,
      opacity: 1,
    });
  }, [activeSlug, location.pathname]);

  return (
    <>
      <style>{`
        .nav-pill {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 32px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          pointer-events: none;
          transition:
            left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.15s ease;
        }

        .nav-active-bar {
          position: absolute;
          bottom: -1px;
          height: 2px;
          background: #18181b;
          border-radius: 2px 2px 0 0;
          pointer-events: none;
          transition:
            left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.2s ease;
        }

        .nav-link-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .nav-link-text {
          position: relative;
          transition: font-weight 0s, letter-spacing 0.2s ease;
        }

        /* Invisible bold ghost keeps width stable so layout doesn't shift */
        .nav-link-text::before {
          content: attr(data-label);
          display: block;
          font-weight: 700;
          height: 0;
          overflow: hidden;
          visibility: hidden;
          pointer-events: none;
        }

        .nav-link-text.is-active {
          font-weight: 600;
          color: #18181b;
        }

        .mobile-link-item {
          position: relative;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .mobile-link-item.is-active {
          background: rgba(0, 0, 0, 0.04);
          color: #18181b;
          font-weight: 600;
        }

        .mobile-active-bar {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 3px;
          height: 60%;
          background: #18181b;
          border-radius: 0 2px 2px 0;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mobile-link-item.is-active .mobile-active-bar {
          transform: translateY(-50%) scaleY(1);
        }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-zinc-900"
          >
            AutoReel<span className="text-zinc-500">Engine</span>
          </Link>

          {/* Desktop Nav */}
          <nav
            ref={navRef}
            className="hidden md:flex items-center space-x-8"
            style={{ position: "relative" }}
            onMouseLeave={() => setHoveredSlug(null)}
          >
            {/* Hover pill */}
            <div
              className="nav-pill"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                opacity: pillStyle.opacity,
              }}
            />

            {/* Active underbar */}
            <div
              className="nav-active-bar"
              style={{
                left: barStyle.left,
                width: barStyle.width,
                opacity: barStyle.opacity,
              }}
            />

            {NAV_LINKS.map((link) => {
              const isActive = activeSlug === link.slug;
              return (
                <div key={link.slug} className="nav-link-wrap">
                  <Link
                    to={link.slug}
                    ref={(el) => {
                      linkRefs.current[link.slug] = el;
                    }}
                    className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors px-2 py-1"
                    style={{ position: "relative", textDecoration: "none" }}
                    onMouseEnter={() => setHoveredSlug(link.slug)}
                  >
                    <span
                      className={`nav-link-text ${isActive ? "is-active" : "font-medium"}`}
                      data-label={link.label}
                    >
                      {link.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-b border-zinc-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-sm">
            {NAV_LINKS.map((link) => {
              const isActive = activeSlug === link.slug;
              return (
                <Link
                  key={link.slug}
                  to={link.slug}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`mobile-link-item block px-3 py-2.5 rounded-lg text-base text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors ${isActive ? "is-active" : "font-medium"}`}
                >
                  <span className="mobile-active-bar" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
