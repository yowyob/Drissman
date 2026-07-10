"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, ArrowRight, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ContactPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "General",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulation
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Message envoyé ! Nous vous répondrons dans les plus brefs délais.");
        setFormData({ name: "", email: "", subject: "General", message: "" });
        setIsSubmitting(false);
    };

    const contactMethods = [
        {
            icon: <Phone className="h-6 w-6 text-signal" />,
            title: "Appelez-nous",
            value: "+237 600 000 000",
            desc: "Disponible Lun-Ven, 8h-18h",
            href: "tel:+237600000000"
        },
        {
            icon: <Mail className="h-6 w-6 text-signal" />,
            title: "Email",
            value: "contact@drissman.cm",
            desc: "Réponse sous 24 heures",
            href: "mailto:contact@drissman.cm"
        },
        {
            icon: <MapPin className="h-6 w-6 text-signal" />,
            title: "Bureaux",
            value: "Yaoundé, Cameroun",
            desc: "Bastos, Avenue John F. Kennedy",
            href: "#"
        }
    ];

    return (
        <div className="min-h-screen bg-asphalt text-snow flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-asphalt/80 backdrop-blur-xl border-b border-white/5">
                <nav className="container-wide flex justify-between items-center py-4">
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-signal/30 to-signal/10 border border-signal/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all">
                            <span className="text-signal font-black text-base">D</span>
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            <span className="text-signal">DRISS</span><span className="text-snow">MAN</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/search" className="text-sm text-mist hover:text-signal transition-colors">Auto-écoles</Link>
                        <Link href="/code" className="text-sm text-mist hover:text-signal transition-colors">Code</Link>
                        <Link href="/partners" className="text-sm text-mist hover:text-signal transition-colors">Partenaires</Link>
                        <ThemeToggle />
                        <Link href="/login" className="text-xs font-bold text-snow">Connexion</Link>
                    </div>

                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
                        {menuOpen ? <X className="h-6 w-6 text-signal" /> : <Menu className="h-6 w-6 text-snow" />}
                    </button>
                </nav>
            </header>

            <main className="flex-1 pt-32 pb-20">
                <div className="container-wide">
                    {/* Hero Section */}
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tight">
                            Comment pouvons-nous <br />
                            <span className="text-signal">vous aider ?</span>
                        </h1>
                        <p className="text-xl text-mist leading-relaxed">
                            Que vous soyez un élève à la recherche d'une formation ou une auto-école souhaitant nous rejoindre, notre équipe est là pour vous accompagner.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-6">
                            {contactMethods.map((method, i) => (
                                <a
                                    key={i}
                                    href={method.href}
                                    className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-signal/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-signal/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {method.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-snow uppercase tracking-widest text-xs mb-1 opacity-60">{method.title}</h3>
                                            <p className="text-lg font-black text-snow group-hover:text-signal transition-colors">{method.value}</p>
                                            <p className="text-sm text-mist">{method.desc}</p>
                                        </div>
                                    </div>
                                </a>
                            ))}

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-signal/20 to-transparent border border-signal/20 mt-8 relative overflow-hidden">
                                <div className="absolute -top-4 -right-4 opacity-10">
                                    <MessageSquare className="h-32 w-32 text-signal" />
                                </div>
                                <h3 className="text-xl font-bold text-snow mb-4 relative z-10">Chat en direct</h3>
                                <p className="text-mist text-sm mb-6 relative z-10">Besoin d'une réponse immédiate ? Discutez avec un conseiller en ligne.</p>
                                <button className="bg-signal text-asphalt font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-signal/20 hover:scale-105 active:scale-95 transition-all relative z-10">
                                    Démarrer le chat
                                </button>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/5 backdrop-blur-md rounded-[40px] border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-mist m-1 block">Nom complet</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-snow focus:border-signal outline-none transition-all placeholder:text-mist/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-mist m-1 block">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@example.cm"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-snow focus:border-signal outline-none transition-all placeholder:text-mist/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-mist m-1 block">Sujet</label>
                                        <select
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-snow focus:border-signal outline-none transition-all"
                                        >
                                            <option value="General" className="bg-charcoal text-white">Demande générale</option>
                                            <option value="Partner" className="bg-charcoal text-white">Devenir partenaire</option>
                                            <option value="Booking" className="bg-charcoal text-white">Problème d&apos;inscription</option>
                                            <option value="Code" className="bg-charcoal text-white">Accès au code de la route</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-mist m-1 block">Message</label>
                                        <textarea
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Comment pouvons-nous vous aider ?"
                                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-snow focus:border-signal outline-none transition-all placeholder:text-mist/20 resize-none"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto bg-signal hover:bg-signal-dark text-asphalt font-black py-5 px-12 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-signal/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-5 w-5 border-2 border-asphalt border-t-transparent rounded-full animate-spin"></div>
                                                Envoi...
                                            </>
                                        ) : (
                                            <>
                                                Envoyer le message <Send className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Decorative glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-signal/5 rounded-full blur-[100px] -z-10"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-8 border-t border-white/5 bg-asphalt/50">
                <div className="container-wide flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-mist font-bold uppercase tracking-widest">
                    <p>&copy; {new Date().getFullYear()} Drissman. Tous droits réservés.</p>
                    <div className="flex gap-8">
                        <Link href="/" className="hover:text-snow transition-colors">Accueil</Link>
                        <Link href="/search" className="hover:text-snow transition-colors">Recherche</Link>
                        <Link href="/partners" className="hover:text-snow transition-colors">Partenaires</Link>
                    </div>
                </div>
            </footer>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-asphalt/98 backdrop-blur-xl z-[60] flex flex-col items-center justify-center space-y-8 md:hidden transition-all duration-500 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
                <Link href="/search" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow hover:text-signal transition-colors uppercase tracking-tight">Auto-écoles</Link>
                <Link href="/code" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow hover:text-signal transition-colors uppercase tracking-tight">Code</Link>
                <Link href="/partners" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow hover:text-signal transition-colors uppercase tracking-tight">Partenaires</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-4xl font-black text-snow hover:text-signal transition-colors uppercase tracking-tight">Connexion</Link>
                <button onClick={() => setMenuOpen(false)} className="mt-8 h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <X className="h-8 w-8 text-snow" />
                </button>
            </div>
        </div>
    );
}
