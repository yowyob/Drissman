
export interface Review {
    id: string;
    user: string;
    rating: number;
    date: string;
    comment: string;
    avatarUrl?: string;
}

export interface Offer {
    id: string;
    title: string;
    price: number;
    description: string;
    type: "Permis B" | "Permis A" | "Code" | "Conduite Accompagnée";
    features: string[];
    imageUrl?: string;
}

export interface Instructor {
    id: string;
    name: string;
    experience: string;
    photoUrl: string;
}

export interface DrivingSchool {
    id: string;
    name: string;
    address: string;
    city: string;
    price: number;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    coordinates: [number, number]; // [lat, lng]
    features: string[];
    isVerified: boolean;

    // Detailed Fields
    description?: string;
    galleryImages?: string[];
    offers?: Offer[];
    reviews?: Review[];
    instructors?: Instructor[];

    /** Distance (km) par rapport à l'utilisateur, si la géolocalisation est active. */
    distanceKm?: number;
}

// NB : ce fichier ne fournit que des TYPES partagés (DrivingSchool, Offer,
// Review, Instructor). Les données réelles proviennent de l'API via
// publicCatalogService / useSchools. Aucune donnée fictive n'est exportée ici.
