"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-signal/30 transition-all duration-300 group"
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        >
            <div className="relative w-5 h-5">
                {/* Sun icon */}
                <Sun
                    className={`absolute inset-0 w-5 h-5 text-signal transition-all duration-300 ${theme === "light"
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 rotate-90 scale-50"
                        }`}
                />
                {/* Moon icon */}
                <Moon
                    className={`absolute inset-0 w-5 h-5 text-signal transition-all duration-300 ${theme === "dark"
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 -rotate-90 scale-50"
                        }`}
                />
            </div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-signal/0 group-hover:bg-signal/5 transition-colors duration-300" />
        </button>
    );
}
