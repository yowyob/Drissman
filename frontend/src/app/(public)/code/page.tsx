"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Shield, Smartphone, Menu, X } from "lucide-react";
import Image from "next/image";
import { CodeCurriculum } from "@/components/code/code-curriculum";
import { QuizDemo } from "@/components/code/quiz-demo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function CodePage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-asphalt text-snow">
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-asphalt/90 backdrop-blur-xl shadow-2xl border-b border-white/5" : "bg-transparent"}`}>
                <nav className="container-wide flex justify-between items-center py-4">
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-signal/30 to-signal/10 backdrop-blur-sm border border-signal/30 flex items-center justify-center group-hover:border-signal/60 group-hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all duration-300">
                            <span className="text-signal font-black text-base">D</span>
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            <span className="text-signal">DRISS</span><span className="text-snow">MAN</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/search" className="relative text-sm text-mist hover:text-signal transition-colors duration-300 group">
                            Auto-écoles
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-signal group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link href="/code" className="relative text-sm text-signal font-medium">
                            Code
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-signal"></span>
                        </Link>
                        <Link href="/partners" className="relative text-sm text-mist hover:text-signal transition-colors duration-300 group">
                            Partenaires
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-signal group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <ThemeToggle />
                        <Link href="/search" className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-2.5 px-6 rounded-xl text-sm shadow-[0_0_20px_rgba(255,193,7,0.25)] hover:shadow-[0_0_30px_rgba(255,193,7,0.4)] transition-all duration-300 hover:scale-[1.02]">
                            Commencer
                        </Link>
                    </div>

                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 z-50 text-snow hover:text-signal transition-colors">
                        {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </nav>

                {/* Mobile Menu */}
                <div className={`fixed inset-0 bg-asphalt/98 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-8 md:hidden transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <Link href="/search" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-snow hover:text-signal transition-colors">Auto-écoles</Link>
                    <Link href="/code" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-signal">Code</Link>
                    <Link href="/partners" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-snow hover:text-signal transition-colors">Partenaires</Link>
                    <div className="mt-4">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-signal/5 to-transparent"></div>
                <div className="container-wide relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal/10 backdrop-blur-sm text-signal text-sm font-bold border border-signal/20">
                                <Star className="h-4 w-4 fill-signal" />
                                N°1 pour le Code de la Route
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black leading-tight">
                                Obtenez votre Code <br />
                                <span className="text-signal">du Premier Coup</span>
                            </h1>
                            <p className="text-xl text-mist max-w-lg mx-auto md:mx-0">
                                Une méthode pédagogique prouvée, des cours interactifs et des tests illimités conformes à l&apos;examen 2024.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Link href="/register" className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-4 px-8 rounded-xl text-lg shadow-[0_0_25px_rgba(255,193,7,0.3)] hover:shadow-[0_0_35px_rgba(255,193,7,0.5)] transition-all">
                                    Essayer Gratuitement
                                </Link>
                                <Link href="#demo" className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-signal/30 text-snow font-bold py-4 px-8 rounded-xl text-lg transition-all">
                                    Voir la démo
                                </Link>
                            </div>
                            <div className="pt-4 flex items-center justify-center md:justify-start gap-4 text-sm text-mist">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-8 w-8 rounded-full bg-white/10 border-2 border-asphalt" />
                                    ))}
                                </div>
                                <span>Déjà 15,000+ élèves formés</span>
                            </div>
                        </div>

                        {/* Hero Image / App Mockup */}
                        <div className="relative h-[500px] w-full hidden md:block">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[700px] rotate-[-5deg] hover:rotate-0 transition-transform duration-700">
                                <div className="relative w-full h-full drop-shadow-2xl">
                                    <Image
                                        src="/code_route_app_dark.png"
                                        alt="Application Code de la Route"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats / Trust */}
            <section className="py-10 bg-white/5 backdrop-blur-sm border-y border-white/5">
                <div className="container-wide">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: "Taux de réussite", value: "95%" },
                            { label: "Questions à jour", value: "2,500+" },
                            { label: "Séries de test", value: "400+" },
                            { label: "Élèves satisfaits", value: "4.9/5" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-black text-signal mb-1">{stat.value}</div>
                                <div className="text-sm text-mist font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Split Section: Curriculum & Demo */}
            <section id="demo" className="py-24">
                <div className="container-wide">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-snow mb-4">Une formation complète et interactive</h2>
                        <p className="text-mist text-lg">
                            Fini les cours ennuyeux. Apprenez le code à votre rythme avec des outils modernes conçus pour la mémorisation.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        {/* Left: Interactive Demo */}
                        <div className="space-y-8">
                            <div className="bg-signal/10 backdrop-blur-sm rounded-2xl p-8 border border-signal/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-snow mb-2">Testez vos connaissances</h3>
                                    <p className="text-mist mb-6">Essayez une question type examen dès maintenant sans inscription.</p>
                                    <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Shield className="h-5 w-5 text-signal" />
                                            <span className="font-semibold text-snow">Mode Examen Réel</span>
                                        </div>
                                        <p className="text-sm text-mist">Chrono, conditions réelles, correction détaillée.</p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-signal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            </div>

                            <QuizDemo />
                        </div>

                        {/* Right: Curriculum */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-snow mb-6">Programme Officiel 2024</h3>
                                <CodeCurriculum />
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 flex items-start gap-4">
                                <div className="h-10 w-10 bg-signal/20 rounded-full flex items-center justify-center shrink-0">
                                    <Smartphone className="h-5 w-5 text-signal" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-snow mb-1">Disponible sur mobile</h4>
                                    <p className="text-sm text-mist">
                                        Révisez partout, tout le temps. Votre progression est synchronisée entre votre ordinateur et votre téléphone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing / Final CTA */}
            <section className="py-24">
                <div className="container-wide">
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-16 text-center relative overflow-hidden border border-white/10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-signal/10 rounded-full blur-[150px]"></div>
                        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold text-snow">Commencez gratuitement aujourd&apos;hui</h2>
                            <p className="text-xl text-mist">
                                Accédez à la première série de tests et au premier module de cours sans payer.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/register" className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-4 px-10 rounded-xl text-lg shadow-[0_0_25px_rgba(255,193,7,0.3)] hover:shadow-[0_0_35px_rgba(255,193,7,0.5)] transition-all">
                                    Créer un compte gratuit
                                </Link>
                            </div>
                            <p className="text-sm text-mist">Aucune carte bancaire requise</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
