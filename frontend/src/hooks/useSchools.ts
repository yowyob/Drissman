import { useState, useCallback, useEffect } from "react";
import { DrivingSchool, Offer } from "@/lib/data";
import { publicCatalogService, type PublicSchoolDto } from "@/lib/public-catalog-service";
import type { GeoCoords } from "@/hooks/useGeolocation";

function mapPermitTypeToOfferType(permitType?: string): Offer["type"] {
  if (permitType === "A") return "Permis A";
  if (permitType === "B") return "Permis B";
  return "Permis B";
}

function mapSchoolOfferToUiOffer(offer: PublicSchoolDto["offers"][number]): Offer {
  return {
    id: offer.id,
    title: offer.name,
    description: offer.description || "Formation complete",
    price: offer.price,
    type: mapPermitTypeToOfferType(offer.permitType),
    features: [`Permis ${offer.permitType || "B"}`, `${offer.hours || 0}h de formation`],
    imageUrl: offer.imageUrl,
  };
}

/** Distance en km entre deux points GPS (formule de Haversine). */
function haversineKm(a: GeoCoords, lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((lat - a.lat) * Math.PI) / 180;
  const dLng = ((lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

/** Ajoute la distance à l'utilisateur et trie du plus proche au plus loin. */
function sortByProximity(list: DrivingSchool[], coords: GeoCoords): DrivingSchool[] {
  return list
    .map((school) => ({
      ...school,
      distanceKm: haversineKm(coords, school.coordinates[0], school.coordinates[1]),
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

async function buildUiSchool(school: PublicSchoolDto): Promise<DrivingSchool | null> {
  const periods = await publicCatalogService.getPublishedTrainingPeriodsBySchool(school.id);
  const publishedOfferIds = new Set(
    periods.flatMap((period) => (period.formations || []).map((formation) => formation.offerId)),
  );

  const visibleOffers = (school.offers || []).filter((offer) => publishedOfferIds.has(offer.id));
  if (visibleOffers.length === 0) {
    return null;
  }

  const permitFeatures = Array.from(
    new Set(visibleOffers.map((offer) => `Permis ${offer.permitType || "B"}`)),
  );

  return {
    id: school.id,
    name: school.name,
    address: school.address || "Adresse non renseignee",
    city: school.city || "Ville non renseignee",
    price: school.minPrice || Math.min(...visibleOffers.map((offer) => offer.price || 0)),
    rating: school.rating || 0,
    reviewCount: school.reviewCount || 0,
    imageUrl:
      school.imageUrl ||
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop",
    coordinates: [school.latitude || 3.848, school.longitude || 11.5021],
    features: permitFeatures.length > 0 ? permitFeatures : ["Formations publiees"],
    isVerified: school.isVerified === true,
    description: school.description || "Auto-ecole partenaire",
    offers: visibleOffers.map(mapSchoolOfferToUiOffer),
    reviews: [],
  };
}

async function loadApiSchools(city?: string, coords?: GeoCoords | null): Promise<DrivingSchool[]> {
  const schools = await publicCatalogService.listSchools();
  const mapped = await Promise.all(
    schools.map(async (school) => {
      try {
        return await buildUiSchool(school);
      } catch {
        return null;
      }
    }),
  );

  const ready = mapped.filter((school): school is DrivingSchool => school !== null);
  const filtered = city ? ready.filter((school) => school.city === city) : ready;
  // Tri par proximité si la position de l'utilisateur est connue.
  return coords ? sortByProximity(filtered, coords) : filtered;
}

export function useSchools(city?: string, coords?: GeoCoords | null) {
  const [schools, setSchools] = useState<DrivingSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On dépend des primitives lat/lng (et non de l'objet) pour éviter les
  // recalculs inutiles quand la référence change sans que les coords bougent.
  const lat = coords?.lat;
  const lng = coords?.lng;

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remoteSchools = await loadApiSchools(
        city,
        lat != null && lng != null ? { lat, lng } : null,
      );
      setSchools(remoteSchools);
    } catch {
      // Pas de repli sur des données fictives : on affiche l'erreur réelle.
      setSchools([]);
      setError("Impossible de charger les auto-ecoles");
    } finally {
      setLoading(false);
    }
  }, [city, lat, lng]);

  useEffect(() => {
    void fetchSchools();
  }, [fetchSchools]);

  return { schools, loading, error, refetch: fetchSchools };
}

export function useSchool(id: string) {
  const [school, setSchool] = useState<DrivingSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiSchool = await publicCatalogService.getSchool(id);
        const mapped = await buildUiSchool(apiSchool);
        if (!mapped) {
          setSchool(null);
          setError("Aucune session publiee disponible pour cette auto-ecole");
        } else {
          setSchool(mapped);
        }
      } catch {
        setSchool(null);
        setError("Auto-ecole introuvable");
      } finally {
        setLoading(false);
      }
    };
    void fetchSchool();
  }, [id]);

  return { school, loading, error };
}
