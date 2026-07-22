import Link from "next/link";

interface LogoProps {
    /** Contrôle la TAILLE du mark (ex : "h-9 w-auto"). */
    className?: string;
    /** Masquer le texte "DRISSMAN" (mark seul). */
    markOnly?: boolean;
    /** Classe du wordmark (taille du texte). */
    wordmarkClassName?: string;
}

/**
 * Logo Drissman — mark SVG (volant stylisé, univers auto-école) + wordmark.
 *
 * ▸ POUR INJECTER VOTRE PROPRE IMAGE : déposez le fichier dans
 *   `frontend/public/brand/logo.svg` (ou .png) et remplacez le bloc <svg>
 *   ci-dessous par :
 *       <img src="/brand/logo.svg" alt="Drissman" className={className ?? "h-9 w-auto"} />
 *   (ou <Image> de next/image). Rien d'autre à changer : le composant est
 *   déjà utilisé partout (sidebars, header mobile).
 */
export function LogoMark({ className = "h-9 w-auto" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 40 40"
            className={className}
            role="img"
            aria-label="Drissman"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="drissman-logo-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFCE3A" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
            </defs>
            {/* Badge arrondi */}
            <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#drissman-logo-g)" />
            {/* Volant stylisé (contraste sur fond ambre) */}
            <g fill="none" stroke="#0B0F14" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="20" cy="20" r="10.5" />
                <circle cx="20" cy="20" r="3.1" fill="#0B0F14" stroke="none" />
                <line x1="20" y1="16.9" x2="20" y2="9.5" />
                <line x1="17.3" y1="21.6" x2="11" y2="25.2" />
                <line x1="22.7" y1="21.6" x2="29" y2="25.2" />
            </g>
        </svg>
    );
}

export function Logo({ className, markOnly = false, wordmarkClassName = "text-lg" }: LogoProps) {
    return (
        <span className="inline-flex items-center gap-2.5">
            <LogoMark className={className ?? "h-9 w-auto"} />
            {!markOnly && (
                <span className={`font-black tracking-tight text-snow leading-none ${wordmarkClassName}`}>
                    DRISS<span className="text-signal">MAN</span>
                </span>
            )}
        </span>
    );
}

/** Logo cliquable (renvoie vers `href`). */
export function LogoLink({ href = "/", className, wordmarkClassName }: LogoProps & { href?: string }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2.5 group">
            <Logo className={className} wordmarkClassName={wordmarkClassName} />
        </Link>
    );
}
