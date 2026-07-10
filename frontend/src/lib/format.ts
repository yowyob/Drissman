
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("fr-CM", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
    }).format(price).replace("FCFA", "").trim() + " FCFA";
}
