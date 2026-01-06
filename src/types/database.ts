export interface Profile {
  id: string;
  // Basic Information
  full_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;

  // Contact Information
  phone_number: string | null;
  email: string | null;

  // Address
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;

  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;

  // Legacy Planning
  special_instructions: string | null;
  executor_name: string | null;
  executor_phone: string | null;
  executor_email: string | null;

  // System
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