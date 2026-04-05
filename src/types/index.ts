/* ==========================================================
   MerryMe — TypeScript Type Definitions
   ========================================================== */

// --- Session ---
export interface Session {
  id: string;
  user_id: string | null;
  couple_name_her: string | null;
  couple_name_him: string | null;
  her_photo_urls: string[];
  him_photo_urls: string[];
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

// --- Generated Image ---
export type GenerationStep = 'snapshot' | 'styling' | 'venue' | 'honeymoon';

export interface GeneratedImage {
  id: string;
  session_id: string;
  step: GenerationStep;
  theme: string | null;
  image_url: string;
  prompt: string | null;
  metadata: Record<string, unknown>;
  is_selected: boolean;
  created_at: string;
}

// --- Venue ---
export interface Venue {
  id: number;
  business_name: string;
  road_address: string | null;
  jibun_address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  hall_count: number | null;
  representative: string | null;
  sido: string | null;
  sigungu: string | null;
  is_operating: boolean;
  cached_at: string;
}

// --- Shared Gallery ---
export interface SharedGallery {
  id: string;
  session_id: string;
  share_code: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
}

// --- API Request/Response Types ---

// Upload
export interface UploadResponse {
  success: boolean;
  sessionId: string;
  url: string;
  path: string;
}

// Generate
export interface GenerateRequest {
  sessionId: string;
  step: GenerationStep;
  options: GenerateOptions;
}

export interface GenerateOptions {
  theme?: string;
  dress?: string;
  tuxedo?: string;
  makeup?: string;
  gender?: 'her' | 'him';
  venueStyle?: string;
  venueName?: string;
  destination?: string;
  scene?: string;
  scenes?: string[];
}

export interface GenerateResponse {
  success: boolean;
  images: string[];
  prompt: string;
  step: GenerationStep;
}

// Gallery
export interface GalleryResponse {
  success: boolean;
  sessionId: string;
  referencePhotos: {
    her?: string;
    him?: string;
  };
  images: Record<GenerationStep, { url: string; name: string }[]>;
  totalCount: number;
}

// Share
export interface ShareRequest {
  sessionId: string;
}

export interface ShareResponse {
  success: boolean;
  shareCode: string;
  shareUrl: string;
}

// Venue API
export interface VenueSearchParams {
  sido?: string;
  sigungu?: string;
  page?: number;
  size?: number;
}

export interface VenueResponse {
  total: number;
  venues: Venue[];
}
