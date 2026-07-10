import { apiClient } from "@/lib/api-client";

export interface PublicSchoolOfferDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  hours: number;
  permitType: string;
}

export interface PublicSchoolDto {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  rating?: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  minPrice?: number;
  isVerified?: boolean;
  reviewCount?: number;
  offers: PublicSchoolOfferDto[];
}

export interface PublishedTrainingPeriodDto {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: "PUBLISHED" | "IN_PROGRESS";
  formations: Array<{
    offerId: string;
    offerName: string;
    permitType: string;
    price: number;
  }>;
}

export const publicCatalogService = {
  listSchools: () => apiClient.get<PublicSchoolDto[]>("/schools"),
  getSchool: (schoolId: string) => apiClient.get<PublicSchoolDto>(`/schools/${schoolId}`),
  getPublishedTrainingPeriodsBySchool: (schoolId: string) =>
    apiClient.get<PublishedTrainingPeriodDto[]>(`/training-periods/published/school/${schoolId}`),
};
