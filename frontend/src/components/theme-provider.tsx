"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isTransitioning: boolean;
}

// Default context value for SSR
const defaultContext: ThemeContextType = {
    theme: "dark",
    toggleTheme: () => { },
    setTheme: () => { },
    isTransitioning: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) {
            setThemeState(stored);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setThemeState(prefersDark ? "dark" : "light");
        }
        setMounted(true);
    }, []);

    // Apply theme class to document
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("light");
        } else {
            root.classList.remove("light");
        }
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        // Start transition animation
        setIsTransitioning(true);

        // Change theme after a slight delay for smooth fade-out
        setTimeout(() => {
            setThemeState(prev => prev === "dark" ? "light" : "dark");
        }, 150);

        // End transition animation after fade completes
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    const setTheme = (newTheme: Theme) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setThemeState(newTheme);
        }, 150);
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        setTheme,
        isTransitioning,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
            {/* Smooth transition overlay */}
            <div
                className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-500 ${isTransitioning
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                style={{
                    background: theme === 'dark'
                        ? 'radial-gradient(circle at center, rgba(248,250,252,0.3) 0%, rgba(248,250,252,0.8) 100%)'
                        : 'radial-gradient(circle at center, rgba(26,26,26,0.3) 0%, rgba(26,26,26,0.8) 100%)',
                }}
            />
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
