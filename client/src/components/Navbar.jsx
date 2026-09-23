import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from "lucide-react";
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

  /* -----------------------------------------
     Close menu when route changes
  ----------------------------------------- */
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  /* -----------------------------------------
     Navigation items
  ----------------------------------------- */
  const items = useMemo(() => {
    const source =
      settings.navigation?.length > 0 ? settings.navigation : DEFAULT_NAV;

    return source.filter((item) => item.enabled);
  }, [settings.navigation]);

  /* -----------------------------------------
     Language label
  ----------------------------------------- */
  const label = (item) =>
    i18n.language === "bn" && item.labelBn ? item.labelBn : item.label;

  /* -----------------------------------------
     Mobile / Desktop menu item
  ----------------------------------------- */
  const menuLinkClass = ({ isActive }) =>
    `
      group
      flex
      w-full
      items-center
      justify-between
      rounded-xl
      px-4
      py-3.5
      text-sm
      font-medium
      transition-all
      duration-200

      ${
        isActive
          ? `
            bg-primary-50
            text-primary-700
            shadow-sm
            ring-1
            ring-primary-100

            dark:bg-primary-950/60
            dark:text-primary-300
            dark:ring-primary-900
          `
          : `
            text-slate-700
            hover:bg-slate-100
            hover:text-slate-900

            dark:text-slate-200
            dark:hover:bg-slate-800
            dark:hover:text-white
          `
      }
    `;

  return (
    <header className="sticky top-0 z-50 w-full px-2 pt-2 sm:px-3 lg:px-5">
      {/* ==================================================
          NAVBAR
      ================================================== */}
      <div
        className="
          relative
          mx-auto
          w-full
          max-w-[1600px]

          rounded-2xl
          border
          border-slate-200/80

          bg-white/95
          shadow-[0_8px_30px_rgba(15,23,42,0.08)]
          backdrop-blur-xl

          dark:border-slate-700/70
          dark:bg-slate-900/95
          dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)]
        "
      >
        {/* ==================================================
            NAVBAR TOP
        ================================================== */}
        <div
          className="
            flex
            min-h-[64px]
            w-full
            items-center
            justify-between
            gap-3

            px-3
            sm:px-4
            lg:px-5
            xl:px-6
          "
        >
          {/* ----------------------------------------------
              BRAND
          ----------------------------------------------- */}
          <Link
            to="/"
            aria-label="Home"
            className="
              min-w-0
              max-w-[180px]
              shrink
              rounded-xl

              outline-none
              transition-transform
              duration-200
              hover:scale-[1.01]

              focus-visible:ring-2
              focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-slate-900

              sm:max-w-[240px]
              lg:max-w-[300px]
            "
          >
            <div className="min-w-0 overflow-hidden">
              <BrandMark className="min-w-0 max-w-full" />
            </div>
          </Link>

          {/* ----------------------------------------------
              RIGHT CONTROLS
          ----------------------------------------------- */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Theme */}
            <div
              className="
                hidden
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-0.5

                sm:flex

                dark:border-slate-700
                dark:bg-slate-800
              "
            >
              <ThemeSwitcher />
            </div>

            {/* Language */}
            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-0.5

                dark:border-slate-700
                dark:bg-slate-800
              "
            >
              <LanguageSwitcher />
            </div>

            {/* Notification */}
            {isAuthenticated && (
              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-0.5

                  dark:border-slate-700
                  dark:bg-slate-800
                "
              >
                <NotificationBell />
              </div>
            )}

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="main-navigation-menu"
              aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-xl
                border
                border-slate-200
                bg-slate-50

                text-slate-700

                transition-all
                duration-200

                hover:bg-slate-100
                active:scale-95

                dark:border-slate-700
                dark:bg-slate-800
                dark:text-slate-200
                dark:hover:bg-slate-700
              "
            >
              <span
                className="
                  transition-transform
                  duration-300
                "
              >
                {open ? <X size={21} /> : <Menu size={21} />}
              </span>
            </button>
          </div>
        </div>

        {/* ==================================================
            MENU PANEL
        ================================================== */}
        <div
          className={`
            grid
            transition-[grid-template-rows,opacity]
            duration-300
            ease-in-out

            ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }
          `}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              id="main-navigation-menu"
              className="
                border-t
                border-slate-200/80

                dark:border-slate-700/70
              "
            >
              <div
                className="
                  mx-auto
                  max-h-[calc(100vh-90px)]
                  w-full
                  max-w-[1600px]
                  overflow-y-auto

                  px-3
                  pb-4
                  pt-4

                  sm:px-5
                  sm:pb-5
                  lg:px-6
                  lg:pb-6
                "
              >
                {/* =================================================
                    MENU HEADER
                ================================================== */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p
                      className="
                        text-xs
                        font-medium
                        uppercase
                        tracking-wider
                        text-slate-400
                        dark:text-slate-500
                      "
                    >
                      Navigation
                    </p>

                    <h2
                      className="
                        mt-0.5
                        text-base
                        font-semibold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {i18n.language === "bn" ? "মেনু" : "Main Menu"}
                    </h2>
                  </div>

                  <span
                    className="
                      rounded-full
                      bg-slate-100
                      px-2.5
                      py-1
                      text-[11px]
                      font-medium
                      text-slate-500

                      dark:bg-slate-800
                      dark:text-slate-400
                    "
                  >
                    {items.length}{" "}
                    {i18n.language === "bn" ? "টি অপশন" : "items"}
                  </span>
                </div>

                {/* =================================================
                    NAVIGATION GRID
                ================================================== */}
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-1.5

                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                  "
                >
                  {items.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      end={item.path === "/"}
                      className={menuLinkClass}
                    >
                      {({ isActive }) => (
                        <>
                          <span className="min-w-0 truncate">
                            {label(item)}
                          </span>

                          <ChevronRight
                            size={17}
                            className={`
                              shrink-0
                              transition-all
                              duration-200

                              ${
                                isActive
                                  ? `
                                    translate-x-0
                                    text-primary-600
                                    dark:text-primary-400
                                  `
                                  : `
                                    -translate-x-1
                                    text-slate-400
                                    group-hover:translate-x-0
                                    group-hover:text-slate-600
                                    dark:group-hover:text-slate-200
                                  `
                              }
                            `}
                          />
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>

                {/* =================================================
                    BOTTOM AREA
                ================================================== */}
                <div
                  className="
                    mt-4
                    grid
                    gap-3

                    lg:grid-cols-[1fr_auto]
                  "
                >
                  {/* Utilities */}
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-3

                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-3

                      dark:border-slate-700
                      dark:bg-slate-800/60
                    "
                  >
                    {/* Theme */}
                    <div className="flex items-center gap-2">
                      <span
                        className="
                          text-xs
                          font-medium
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Theme
                      </span>

                      <div
                        className="
                          rounded-lg
                          border
                          border-slate-200
                          bg-white
                          p-0.5

                          dark:border-slate-700
                          dark:bg-slate-900
                        "
                      >
                        <ThemeSwitcher />
                      </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center gap-2">
                      <span
                        className="
                          text-xs
                          font-medium
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Language
                      </span>

                      <div
                        className="
                          rounded-lg
                          border
                          border-slate-200
                          bg-white
                          p-0.5

                          dark:border-slate-700
                          dark:bg-slate-900
                        "
                      >
                        <LanguageSwitcher />
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      AUTH
                  ================================================== */}
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      className="
                        flex
                        min-w-[180px]
                        items-center
                        justify-center
                        gap-2

                        rounded-xl
                        bg-primary-600
                        px-5
                        py-3

                        text-sm
                        font-semibold
                        text-white

                        shadow-md
                        shadow-primary-600/20

                        transition-all
                        duration-200

                        hover:bg-primary-700
                        hover:shadow-lg

                        dark:bg-primary-500
                        dark:hover:bg-primary-600
                      "
                    >
                      <LayoutDashboard size={17} />

                      <span>{t("common.dashboard")}</span>
                    </Link>
                  ) : (
                    <div
                      className="
                        grid
                        min-w-[260px]
                        grid-cols-2
                        gap-2
                      "
                    >
                      <Link
                        to="/login"
                        className="
                          flex
                          items-center
                          justify-center
                          gap-1.5

                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3

                          text-sm
                          font-semibold
                          text-slate-700

                          transition-all
                          hover:bg-slate-100

                          dark:border-slate-700
                          dark:bg-slate-900
                          dark:text-slate-200
                          dark:hover:bg-slate-800
                        "
                      >
                        <LogIn size={16} />
                        <span>{t("common.login")}</span>
                      </Link>

                      <Link
                        to="/register"
                        className="
                          flex
                          items-center
                          justify-center
                          gap-1.5

                          rounded-xl
                          bg-primary-600
                          px-4
                          py-3

                          text-sm
                          font-semibold
                          text-white

                          shadow-md
                          shadow-primary-600/20

                          transition-all
                          hover:bg-primary-700
                          hover:shadow-lg

                          dark:bg-primary-500
                          dark:hover:bg-primary-600
                        "
                      >
                        <UserPlus size={16} />
                        <span>{t("common.register")}</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
