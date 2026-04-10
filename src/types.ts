export type PlanType = 'free' | 'pro' | 'business';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  plan: PlanType;
  docs_this_month: number;
}

export interface Document {
  id: string;
  owner_id: string;
  title: string;
  status: 'pending' | 'signed' | 'declined';
  created_at: string;
  file_url?: string;
  content?: string;
  signer_email?: string;
  ai_analysis?: {
    summary: string;
    positive_points: string[];
    attention_points: string[];
  };
  signature_data?: string;
  signed_at?: string;
  signature_method?: 'draw' | 'upload' | 'document';
  signature_details?: string;
  copy_requested?: boolean;
}

export const PLAN_LIMITS = {
  free: 3,
  pro: 50,
  business: Infinity,
};

export const PLAN_PRICES = {
  BRL: {
    free: 'Grátis',
    pro: 'R$29/mês',
    business: 'R$79/mês',
  },
  USD: {
    free: 'Free',
    pro: '$9/mo',
    business: '$25/mo',
  },
  EUR: {
    free: 'Free',
    pro: '€9/mo',
    business: '€25/mo',
  }
};
