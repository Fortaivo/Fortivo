import { useState, useEffect } from 'react';
import { type Subscription } from '../types/database';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data?.[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
    } finally {
      setLoading(false);
    }
  }

  async function updateSubscription(tier: Subscription['tier']) {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prevent duplicate subscription
      if (subscription?.status === 'active' && subscription.tier === tier) {
        throw new Error('You are already subscribed to this plan');
      }

      if (tier === 'free') {
        const now = new Date();
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 100);

        setLoading(true);
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            tier,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: farFuture.toISOString(),
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
          })
          .select()
          .single();

        if (error) throw error;
        setSubscription(data);
        setLoading(false);
        return data;
      }

      // For paid tiers, redirect to Stripe checkout
      const PRICE_IDS = {
        pro: 'price_pro_monthly',
        premium: 'price_premium_monthly'
      };
      
      const priceId = PRICE_IDS[tier];
      if (!priceId) {
        throw new Error('Invalid subscription tier');
      }

      await createCheckoutSession(priceId);
    } catch (err) {
      let message = 'Failed to update subscription';
      if (err instanceof Error) {
        message = err.message;
        // Clean up error messages
        if (message.includes('new row violates row-level security')) {
          message = 'You don\'t have permission to perform this action';
        }
      }
      setError(new Error(message));
      throw new Error(message);
    }
  }

  async function cancelSubscription() {
    try {
      if (!subscription) throw new Error('No active subscription');

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscription.id);

      if (error) throw error;
      setSubscription((prev) => prev ? { ...prev, status: 'canceled' } : null);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to cancel subscription');
    }
  }

  return {
    subscription,
    loading,
    error,
    updateSubscription,
    cancelSubscription,
    refresh: fetchSubscription,
  };
}