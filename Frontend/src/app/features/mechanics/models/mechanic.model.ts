export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MechanicReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Mechanic {
  id: string;
  fullName: string;
  workshopName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isVerified: boolean;
  address: string;
  location: Coordinates;
  reviews: MechanicReview[];
}
