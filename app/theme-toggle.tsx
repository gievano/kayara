"use client";
import { useEffect, useState } from "react";
// ponytail: minimal dark toggle 1:1 ten-site
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setDark(isDark);
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch {}
  };
  return (
    <button
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={`group h-9 w-9 grid place-items-center rounded-full border bg-white/80 backdrop-blur border-stone-200 text-stone-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] dark:bg-stone-900/60 dark:border-white/10 dark:text-stone-300 dark:hover:border-[var(--color-accent)] dark:hover:text-[var(--color-accent)] transition-all duration-200 cursor-pointer shadow-sm ${className}`}
      style={{ boxShadow: dark ? "0 0 20px rgba(214,160,84,0.15)" : undefined }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform group-active:scale-90"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform group-active:scale-90"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      )}
    </button>
  );
}
