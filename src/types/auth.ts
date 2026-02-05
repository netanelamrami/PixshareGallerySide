export interface User {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  selfieImage: string; // base64 or blob URL
  createdAt: Date;
  isActive: boolean;
  photoUrl?: string; // Optional, can be used instead of selfieImage
  sendNotification?: boolean; // Indicates if the user wants to receive notifications
  phoneNumber: string;
  eventId: number;
  faceId: string;
  sumPhotos?: number | null;
  registeredDate?: string | null; 
  minAge?: number | null;
  maxAge?: number | null;
  gender?: string | null;
  registerWith?: string | null;
  relatedToUserId?: number | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
}

export interface SelectedFace {
  index: number;
  imageUrl: string;
  name: string;
}


export type RegisterFacesRequest = {
  reRegister ?: boolean;
  eventId: number;
  contactInfo: string;
  authenticateBy: "Email" | "PhoneNumber" | "Selfie";
  faces: {
    imageUrl: string;
    name: string;
  }[];
};
