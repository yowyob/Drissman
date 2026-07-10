// Re-export the public landing page as the root page
// Do NOT use redirect("/") here — it causes an infinite redirect loop on Vercel
export { default } from "./(public)/page";
