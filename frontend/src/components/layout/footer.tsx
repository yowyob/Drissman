import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center space-x-2 mb-6">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">Drissman</span>
                        </Link>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            La première plateforme de comparaison et d&apos;inscription aux auto-écoles au Cameroun. Passez votre permis en toute confiance.
                        </p>
                        <div className="flex space-x-4">
                            <SocialLink href="https://facebook.com/drissman" icon={<Facebook className="h-5 w-5" />} />
                            <SocialLink href="https://instagram.com/drissman" icon={<Instagram className="h-5 w-5" />} />
                            <SocialLink href="https://twitter.com/drissman" icon={<Twitter className="h-5 w-5" />} />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Navigation</h3>
                        <ul className="space-y-4 text-sm">
                            <li><FooterLink href="/search">Trouver une auto-école</FooterLink></li>
                            <li><FooterLink href="/code">Code de la route</FooterLink></li>
                            <li><FooterLink href="/partners">Espace Partenaire</FooterLink></li>
                            <li><FooterLink href="/login">Connexion</FooterLink></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Informations</h3>
                        <ul className="space-y-4 text-sm">
                            <li><FooterLink href="/">À propos de nous</FooterLink></li>
                            <li><FooterLink href="/contact">Contact</FooterLink></li>
                            <li><FooterLink href="/">Conditions Générales</FooterLink></li>
                            <li><FooterLink href="/">Politique de Confidentialité</FooterLink></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Contact</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0" />
                                <span>Yaoundé, Cameroun</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+237 600 000 000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>contact@drissman.cm</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Drissman. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
    return (
        <a href={href} className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
            {icon}
        </a>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} className="hover:text-primary transition-colors">
            {children}
        </Link>
    );
}
