"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * FooterVariant2 — Adaptation intelligente du design Hero (AeroSection)
 * 
 * Variant 2 : Footer minimaliste avec textures et gradients subtils
 * - Design épuré mais avec les textures du Hero
 * - Gradients très subtils
 * - Effets de lumière discrets
 * - Focus sur la lisibilité et l'élégance
 */

export default function FooterVariant2() {
    const footerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".footer-col", {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: footerRef.current,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            });
        }, footerRef);
        return () => ctx.revert();
    }, []);

    // Texture subtile adaptée du Hero
    const subtleTexture = `
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E"),
        linear-gradient(to bottom, #0d0d0d 0%, #1a1a1a 100%)
    `;

    return (
        <footer ref={footerRef} className="relative pt-20 pb-10 overflow-hidden" style={{ background: subtleTexture }}>
            {/* Background layers - très subtils */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Glow très subtil en haut */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-signal/3 rounded-full blur-[100px]"></div>

                {/* Gradient vertical très léger */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-asphalt/30 to-asphalt"></div>
            </div>

            <div className="container-wide relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="footer-col">
                        <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-signal/20 to-signal/10 backdrop-blur-sm border border-signal/20 flex items-center justify-center group-hover:border-signal/40 transition-all duration-300">
                                <span className="text-signal font-black text-base">D</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">
                                DRISS<span className="text-signal/80">MAN</span>
                            </span>
                        </Link>
                        <p className="text-mist/80 text-sm mb-6 leading-relaxed">
                            La première plateforme de comparaison et d&apos;inscription aux auto-écoles au Cameroun. Passez votre permis en toute confiance.
                        </p>
                        <div className="flex space-x-2">
                            <SocialLink href="#" icon={<Facebook className="h-4 w-4" />} />
                            <SocialLink href="#" icon={<Instagram className="h-4 w-4" />} />
                            <SocialLink href="#" icon={<Twitter className="h-4 w-4" />} />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h3 className="text-white font-semibold text-base mb-5 tracking-tight">Navigation</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><FooterLink href="/search">Trouver une auto-école</FooterLink></li>
                            <li><FooterLink href="/code">Code de la route</FooterLink></li>
                            <li><FooterLink href="/partners">Espace Partenaire</FooterLink></li>
                            <li><FooterLink href="/login">Connexion</FooterLink></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="footer-col">
                        <h3 className="text-white font-semibold text-base mb-5 tracking-tight">Informations</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li><FooterLink href="#">À propos de nous</FooterLink></li>
                            <li><FooterLink href="#">Contact</FooterLink></li>
                            <li><FooterLink href="#">Conditions Générales</FooterLink></li>
                            <li><FooterLink href="#">Politique de Confidentialité</FooterLink></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-col">
                        <h3 className="text-white font-semibold text-base mb-5 tracking-tight">Contact</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 text-signal/60 shrink-0 mt-0.5" />
                                <span className="text-mist/80">Yaoundé, Cameroun</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 text-signal/60 shrink-0" />
                                <span className="text-mist/80">+237 600 000 000</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-signal/60 shrink-0" />
                                <span className="text-mist/80">contact@drissman.cm</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 text-center">
                    <p className="text-fog/60 text-xs tracking-wide">
                        &copy; {new Date().getFullYear()} <span className="text-signal/70 font-semibold">DRISSMAN</span>. Tous droits réservés.
                    </p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
    return (
        <a
            href={href}
            className="h-9 w-9 rounded-full bg-white/3 backdrop-blur-sm border border-white/5 flex items-center justify-center hover:bg-signal/10 hover:border-signal/30 transition-all duration-300"
        >
            <div className="text-mist/60 hover:text-signal transition-colors">
                {icon}
            </div>
        </a>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-mist/70 hover:text-signal transition-colors duration-200 inline-block"
        >
            {children}
        </Link>
    );
}
