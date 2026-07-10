"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Users, Shield, CheckCircle, BarChart3, Globe, Smartphone, Menu, X } from "lucide-react";
import { PricingSection } from "@/components/partners/pricing-section";
import { RegistrationPreview } from "@/components/partners/registration-preview";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PartnersPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const features = [
        {
            icon: <Globe className="h-6 w-6 text-signal" />,
            title: "Site Vitrine Inclus",
            desc: "Une page dédiée optimisée pour le SEO local. Soyez visible quand les élèves cherchent une auto-école dans votre quartier."
        },
        {
            icon: <BarChart3 className="h-6 w-6 text-signal" />,
            title: "Tableau de Bord",
            desc: "Suivez votre chiffre d'affaires, vos taux de réussite et vos nouvelles inscriptions en temps réel."
        },
        {
            icon: <CheckCircle className="h-6 w-6 text-signal" />,
            title: "Inscriptions en ligne",
            desc: "Fini les appels manqués. Les élèves peuvent réserver et payer leurs forfaits directement en ligne, 24/7."
        },
        {
            icon: <Users className="h-6 w-6 text-signal" />,
            title: "Gestion des Élèves",
            desc: "Dossiers numérisés, suivi de progression, rappels automatiques par SMS pour les heures de conduite."
        },
        {
            icon: <Smartphone className="h-6 w-6 text-signal" />,
            title: "Application Moniteur",
            desc: "Vos moniteurs voient leur planning sur leur téléphone et notent les progrès des élèves en direct."
        },
        {
            icon: <Shield className="h-6 w-6 text-signal" />,
            title: "Paiements Sécurisés",
            desc: "Recevez vos paiements chaque semaine. Nous gérons la facturation et les reçus automatiquement."
        }
    ];

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
                        <Link href="/code" className="relative text-sm text-mist hover:text-signal transition-colors duration-300 group">
                            Code
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-signal group-hover:w-full transition-all duration-300"></span>
                        </Link>
                        <Link href="/partners" className="relative text-sm text-signal font-medium">
                            Partenaires
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-signal"></span>
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
                    <Link href="/code" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-snow hover:text-signal transition-colors">Code</Link>
                    <Link href="/partners" onClick={() => setMenuOpen(false)} className="text-3xl font-bold text-signal">Partenaires</Link>
                    <div className="mt-4">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-signal/5 to-transparent"></div>
                <div className="container-wide relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 backdrop-blur-sm text-green-400 text-sm font-bold border border-green-500/20">
                                <TrendingUp className="h-4 w-4" />
                                +40% de chiffre d&apos;affaires en moyenne
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-black leading-tight">
                                Digitalisez votre <br />
                                <span className="text-signal">Auto-École</span>
                            </h1>
                            <p className="text-xl text-mist leading-relaxed max-w-lg">
                                Drissman est la plateforme tout-en-un pour gérer vos élèves, vos plannings et recevoir de nouvelles inscriptions 24h/24.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Link href="/register" className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-4 px-8 rounded-xl text-lg shadow-[0_0_25px_rgba(255,193,7,0.3)] hover:shadow-[0_0_35px_rgba(255,193,7,0.5)] transition-all">
                                    Essayer Gratuitement
                                </Link>
                                <Link href="#features" className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-signal/30 text-snow font-bold py-4 px-8 rounded-xl text-lg transition-all">
                                    Découvrir les outils
                                </Link>
                            </div>
                            <p className="text-sm text-mist flex items-center gap-2">
                                <Shield className="h-4 w-4 text-signal" /> Pas de carte bancaire requise • Annulation à tout moment
                            </p>
                        </div>

                        {/* Hero Image / Dashboard Mockup */}
                        <div className="relative hidden lg:block">
                            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm transform rotate-1 hover:rotate-0 transition-all duration-700">
                                <Image
                                    src="/partners_dashboard_dark.png"
                                    alt="Tableau de bord Drissman"
                                    width={800}
                                    height={500}
                                    className="w-full h-auto object-cover"
                                    priority
                                />
                                {/* Floating stats badge */}
                                <div className="absolute -bottom-6 -left-6 bg-asphalt/90 backdrop-blur-xl text-snow p-4 rounded-xl shadow-xl border border-white/10 hidden md:block">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-signal/20 p-2 rounded-full">
                                            <Users className="h-6 w-6 text-signal" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-mist font-bold uppercase">Nouveaux élèves</div>
                                            <div className="text-xl font-bold text-signal">+24 cette semaine</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Logo Cloud (Social Proof) */}
            <section className="py-10 bg-white/5 backdrop-blur-sm border-y border-white/5">
                <div className="container-wide">
                    <p className="text-center text-sm font-semibold text-mist uppercase tracking-widest mb-6">Ils nous font déjà confiance</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 hover:opacity-100 transition-all duration-500">
                        {["Auto-École Star", "Permis Express", "Conduite Plus", "Elite Driving", "Safe Route"].map((brand, i) => (
                            <span key={i} className="text-xl font-bold font-serif text-snow">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24">
                <div className="container-wide">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-snow mb-4">Tout ce dont vous avez besoin pour réussir</h2>
                        <p className="text-mist text-lg">
                            Remplacez vos fichiers Excel et papiers par une suite d&apos;outils puissants conçus spécifiquement pour les auto-écoles.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10 hover:border-signal/20 group">
                                <div className="h-12 w-12 bg-signal/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-signal/20">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-snow mb-3">{feature.title}</h3>
                                <p className="text-mist leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Components Injection */}
            <RegistrationPreview />
            <PricingSection />

            {/* Final CTA */}
            <section className="py-24">
                <div className="container-wide">
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-16 text-center relative overflow-hidden border border-white/10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-signal/10 rounded-full blur-[150px]"></div>
                        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                            <h2 className="text-4xl font-bold text-snow">Prêt à moderniser votre auto-école ?</h2>
                            <p className="text-xl text-mist">
                                Rejoignez plus de 500 auto-écoles qui font confiance à Drissman.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/register" className="bg-signal hover:bg-signal-dark text-asphalt font-bold py-4 px-10 rounded-xl text-lg shadow-[0_0_25px_rgba(255,193,7,0.3)] hover:shadow-[0_0_35px_rgba(255,193,7,0.5)] transition-all">
                                    Créer mon compte partenaire
                                </Link>
                                <Link href="/contact" className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-signal/30 text-snow font-bold py-4 px-10 rounded-xl text-lg transition-all">
                                    Parler à un expert
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
