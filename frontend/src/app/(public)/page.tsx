// Updated: 2026-02-23T01:20
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Hero from "./components/Hero";
import StatsVariant2 from "./components/StatsVariant2";
import WorkflowVariant from "./components/WorkflowVariant";
import SelectionPopulaireVariant from "./components/SelectionPopulaireVariant";
import CTAVariant2 from "./components/CTAVariant2";
import TestimonialsVariant from "./components/TestimonialsVariant";
import FooterVariant2 from "./components/FooterVariant2";

export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);


    return (
        <div className="flex flex-col min-h-screen font-sans overflow-x-hidden bg-asphalt text-snow relative">
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-asphalt/90 backdrop-blur-xl shadow-2xl border-b border-white/5" : "bg-transparent"}`}>
                <nav className="container-wide flex justify-between items-center py-4">
                    {/* Logo with Glassmorphism */}
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-signal/30 to-signal/10 backdrop-blur-sm border border-signal/30 flex items-center justify-center group-hover:border-signal/60 group-hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all duration-300">
                            <span className="text-signal font-black text-base">D</span>
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            <span className="text-signal">DRISS</span><span className="text-snow">MAN</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/search" className="relative text-sm text-mist hover:text-signal transition-colors duration-300 group">
                            Auto-écoles
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-signal group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link href="/code" className="relative text-sm text-mist hover:text-signal transition-colors duration-300 group">
                            Code
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-signal group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link href="/partners" className="relative text-sm text-mist hover:text-signal transition-colors duration-300 group">
                            Partenaires
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-signal group-hover:w-full transition-all duration-300"></span>
                        </Link>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <Link href="/login" className="text-sm text-mist hover:text-snow transition-colors">
                                Se connecter
                            </Link>
                            <Link
                                href="/register"
                                className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-2.5 px-6 rounded-xl text-sm shadow-[0_0_20px_rgba(255,193,7,0.25)] hover:shadow-[0_0_30px_rgba(255,193,7,0.4)] transition-all duration-300 hover:scale-[1.02]"
                            >
                                S&apos;inscrire
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 z-50 text-snow hover:text-signal transition-colors"
                    >
                        {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </nav>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-asphalt/98 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 md:hidden transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <Link href="/search" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-snow hover:text-signal transition-colors">Auto-écoles</Link>
                    <Link href="/code" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-snow hover:text-signal transition-colors">Code</Link>
                    <Link href="/partners" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-snow hover:text-signal transition-colors">Partenaires</Link>

                    {/* Theme Toggle Mobile */}
                    <div className="mt-4">
                        <ThemeToggle />
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-white/10">
                        <Link href="/login" onClick={() => setMenuOpen(false)} className="text-xl text-mist hover:text-snow transition-colors">Se connecter</Link>
                        <Link
                            href="/register"
                            onClick={() => setMenuOpen(false)}
                            className="bg-signal text-asphalt font-bold py-3 px-8 rounded-xl text-lg shadow-[0_0_30px_rgba(255,193,7,0.4)]"
                        >
                            S&apos;inscrire

                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <Hero />

            {/* Stats Section */}
            <StatsVariant2 />

            {/* Workflow Section */}
            <WorkflowVariant />

            {/* Selection Populaire Section */}
            <SelectionPopulaireVariant />

            {/* Testimonials Section */}
            <TestimonialsVariant />

            {/* CTA Section */}
            <CTAVariant2 />

            {/* Footer */}
            <FooterVariant2 />
        </div>
    );
}
