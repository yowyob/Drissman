import { useState, useCallback, useEffect } from "react";
import { DrivingSchool, Offer } from "@/lib/data";
import { publicCatalogService, type PublicSchoolDto } from "@/lib/public-catalog-service";

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

async function loadApiSchools(city?: string): Promise<DrivingSchool[]> {
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
  if (!city) return ready;
  return ready.filter((school) => school.city === city);
}

export function useSchools(city?: string) {
  const [schools, setSchools] = useState<DrivingSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remoteSchools = await loadApiSchools(city);
      setSchools(remoteSchools);
    } catch {
      // Pas de repli sur des données fictives : on affiche l'erreur réelle.
      setSchools([]);
      setError("Impossible de charger les auto-ecoles");
    } finally {
      setLoading(false);
    }
  }, [city]);

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
