export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: 'financial' | 'physical' | 'digital' | 'other';
  description: string | null;
  estimated_value: number | null;
  beneficiary_id: string | null;
  beneficiary?: {
    id: string;
    full_name: string;
  } | null;
  location: string | null;
  acquisition_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetBeneficiary {
  asset_id: string;
  beneficiary_id: string;
  allocation_percentage: number;
  created_at: string;
}

export interface AssetDocument {
  id: string;
  asset_id: string;
  name: string;
  file_path: string;
  file_type: 'pdf' | 'image' | 'document';
  file_size: number;
  uploaded_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'premium';
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}