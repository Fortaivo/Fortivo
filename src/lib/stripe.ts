import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { toast } from './toast';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Missing Stripe publishable key');
      throw new Error('Payment system configuration error');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

const PRICE_IDS = {
  pro: 'price_pro_monthly',
  premium: 'price_premium_monthly'
} as const;

export async function createCheckoutSession(priceId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Please sign in to continue');
      return;
    }

    // Show loading state
    const loadingToast = toast.loading('Preparing checkout...');

    // Get the current URL for success/cancel redirects
    const origin = window.location.origin;
    
    // Validate price ID
    if (!Object.values(PRICE_IDS).includes(priceId as any)) {
      throw new Error('Invalid subscription plan');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        priceId,
        successUrl: `${origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/subscription?canceled=true&session_id={CHECKOUT_SESSION_ID}`
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
    });

    if (error) {
      console.error('Function error:', error);
      toast.dismiss(loadingToast);
      throw new Error(error.message || 'Payment setup failed. Please try again.');
    }

    if (!data?.sessionId) {
      toast.dismiss(loadingToast);
      throw new Error('Could not create payment session. Please try again.');
    }

    const stripe = await getStripe();
    if (!stripe) {
      toast.dismiss(loadingToast);
      throw new Error('Payment system failed to initialize');
    }
    toast.dismiss(loadingToast);

    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (result.error) {
      throw result.error;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment setup failed';
    toast.error(message);
    throw new Error(message);
  }
}