import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import BrandMark from "./BrandMark.jsx";
import ThemeSwitcher from "./ThemeSwitcher.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { DEFAULT_NAV } from "../constants/site.js";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const items = useMemo(() => {
    const source = settings.navigation?.length
      ? settings.navigation
      : DEFAULT_NAV;
    return source.filter((i) => i.enabled);
  }, [settings.navigation]);

  const label = (i) =>
    i18n.language === "bn" && i.labelBn ? i.labelBn : i.label;

  const linkClass = ({ isActive }) =>
    `px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
      isActive
        ? "text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400 font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full overflow-hidden border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex-shrink-0 max-w-[150px] sm:max-w-none truncate">
          <BrandMark className="min-w-0" />
        </div>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
          {items.map((i) => (
            <NavLink
              key={i.key}
              to={i.path}
              end={i.path === "/"}
              className={linkClass}
            >
              {label(i)}
            </NavLink>
          ))}
        </nav>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
          <LanguageSwitcher />

          {isAuthenticated && <NotificationBell />}

          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                {t("common.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("common.login")}
                </Link>
                <Link
                  to="/register"
                  className="whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  {t("common.register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 xl:hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="flex flex-col gap-1">
            {items.map((i) => (
              <NavLink
                key={i.key}
                to={i.path}
                end={i.path === "/"}
                className={linkClass}
              >
                {label(i)}
              </NavLink>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between sm:hidden">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Theme
              </span>
              <ThemeSwitcher />
            </div>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="block w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500"
              >
                {t("common.dashboard")}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {t("common.login")}
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500"
                >
                  {t("common.register")}
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
