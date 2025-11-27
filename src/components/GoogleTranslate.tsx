"use client";

import React, { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function GoogleTranslate(): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const scriptId = "google-translate-script";
  const elementId = "google_translate_element";
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If TranslateElement already exists, try to create widget immediately
    const tryInit = () => {
      try {
        if (!window.google?.translate?.TranslateElement) return;
        // Initialize into the container
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
          elementId
        );
      } catch (e) {
        setFailed(true);
      }
    };

    if (window.google?.translate?.TranslateElement) {
      tryInit();
      return;
    }

    // Setup global callback expected by Google's script
    window.googleTranslateElementInit = () => {
      tryInit();
    };

    // Avoid injecting twice
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Google's script will call the callback; add a short timeout to detect failures
      setTimeout(() => {
        if (!window.google?.translate?.TranslateElement) {
          setFailed(true);
        }
      }, 1200);
    };
    script.onerror = () => {
      setFailed(true);
    };
    document.head.appendChild(script);

    // Leave the script in place so user navigation doesn't reload it unnecessarily
    // Cleanup: no removal to keep widget working across navigations
  }, []);

  // close panel when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const panel = document.getElementById("google-translate-panel");
      const btn = document.getElementById("google-translate-btn");
      if (!panel || !btn) return;
      if (panel.contains(target) || btn.contains(target)) return;
      setOpen(false);
    };
    if (open) {
      document.addEventListener("click", onDocClick);
    }
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  // manage panel mount/visibility for animation
  useEffect(() => {
    let t1: number | undefined;
    let t2: number | undefined;
    if (open) {
      setPanelMounted(true);
      // next tick set visible to trigger transition
      t1 = window.setTimeout(() => setPanelVisible(true), 10);
    } else {
      // start hide animation
      setPanelVisible(false);
      // unmount after animation ends
      t2 = window.setTimeout(() => setPanelMounted(false), 180);
    }
    return () => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
  }, [open]);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // focus trap for panel
  useEffect(() => {
    if (!panelMounted) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));

    if (focusable.length) {
      // focus first item for keyboard users
      focusable[0].focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelMounted]);

  const indianLanguages: Array<[string, string]> = [
    ["hi", "Hindi"],
    ["bn", "Bengali"],
    ["te", "Telugu"],
    ["mr", "Marathi"],
    ["ta", "Tamil"],
    ["ur", "Urdu"],
    ["gu", "Gujarati"],
    ["kn", "Kannada"],
    ["ml", "Malayalam"],
    ["or", "Odia"],
    ["pa", "Punjabi"],
    ["as", "Assamese"],
  ];

  const setLanguageAndReload = (target: string) => {
    const val = `/en/${target}`;
    try {
      document.cookie = `googtrans=${val}; path=/`;
    } catch (e) {
      // ignore
    }
    // best-effort domain root write
    try {
      const host = window.location.hostname;
      const domain = host.split(".").slice(-2).join(".");
      document.cookie = `googtrans=${val}; path=/; domain=${domain}`;
    } catch (e) {
      // ignore
    }
    try {
      localStorage.setItem("preferredLanguage", target);
    } catch (e) {}
    // give a tiny visual feedback then reload
    setPanelVisible(false);
    setTimeout(() => window.location.reload(), 180);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
      {/* Compact icon-only button */}
      <button
        id="google-translate-btn"
        ref={buttonRef}
        aria-expanded={open}
        aria-controls="google-translate-panel"
        aria-haspopup="true"
        onClick={() => setOpen((s) => !s)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={
          "w-10 h-10 rounded-full bg-white/95 dark:bg-gray-800/95 flex items-center justify-center shadow border border-gray-200 dark:border-gray-700 focus:outline-none transform transition-transform duration-150 " +
          (open ? "scale-105" : "hover:scale-105")
        }
        title="Translate"
      >
        {/* simple Google 'G' icon */}
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M44.5 20H24v8.5h11.9C34.2 33.2 30 36 24 36c-7.7 0-14-6.3-14-14s6.3-14 14-14c3.8 0 6.9 1.5 9.3 3.9l6.6-6.6C36.8 2.9 30.7 0 24 0 10.7 0 0 10.7 0 24s10.7 24 24 24c13.3 0 24-10.7 24-24 0-1.6-.2-3.1-.5-4.5z" fill="#4285F4" />
        </svg>
      </button>

      {/* Tooltip above button */}
      {showTooltip && (
        <div className="absolute -top-9 right-0 w-max px-2 py-1 rounded text-xs bg-black text-white/90 dark:bg-white/10 dark:text-white/90 shadow">
          Translate
        </div>
      )}

      {/* Panel that contains our compact language list - animated. Positioned absolutely so it won't shift the button. */}
      {panelMounted && (
        <div
          id="google-translate-panel"
          ref={panelRef}
          className={
            "absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-gray-800/95 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2 text-sm origin-top-right transform transition-all duration-150 " +
            (panelVisible ? "opacity-100 scale-100" : "opacity-0 scale-95")
          }
          role="menu"
          aria-labelledby="google-translate-btn"
          aria-hidden={!panelVisible}
        >
          {/* caret connector */}
          <div className="absolute -top-2 right-4 w-3 h-3">
            <svg width="12" height="12" viewBox="0 0 12 12" className="block" aria-hidden>
              <path d="M0 0 L6 6 L12 0" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200 dark:text-gray-700" />
              <path d="M0 0 L6 6 L12 0 L0 0" fill="currentColor" className="text-white dark:text-gray-800" />
            </svg>
          </div>
          <div className="mb-1">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">Select language</div>
            <ul className="max-h-64 overflow-auto">
              {indianLanguages.map(([code, label]) => (
                <li key={code}>
                  <button
                    onClick={() => setLanguageAndReload(code)}
                    className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setLanguageAndReload("en")}
                  className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200"
                >
                  English (original)
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
