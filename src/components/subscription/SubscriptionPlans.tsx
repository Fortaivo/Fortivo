import { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSubscription } from '../../hooks/useSubscription';
import { toast } from '../../lib/toast';
import type { Subscription } from '../../types/database';
import { API_BASE_URL } from '../../lib/api';

const PLANS = [
  {
    tier: 'free' as const,
    name: 'Free',
    price: 0.00,
    features: [
      'Up to 20 assets',
      'Basic portfolio tracking',
      'Essential security features',
    ],
  },
  {
    tier: 'pro' as const,
    name: 'Pro',
    price: 0.99,
    features: [
      'Unlimited assets',
      'Document attachments',
      'Advanced tracking features',
      'Priority support',
    ],
  },
  {
    tier: 'premium' as const,
    name: 'Premium',
    price: 1.99,
    features: [
      'Everything in Pro',
      'AI-powered insights',
      'Unlimited beneficiaries',
      'API access',
    ],
  },
] as const;

export function SubscriptionPlans() {
  const { subscription, updateSubscription } = useSubscription();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: Subscription['tier']) => {
    try {
      setProcessing(true);
      setError(null);
      
      const loadingToast = toast.loading('Updating subscription...');
      
      await updateSubscription(tier);
      
      toast.dismiss(loadingToast);
      toast.success('Subscription updated successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subscription';
      setError(message);
      toast.error(message);
    } finally {
      // Only set processing to false if we're not redirecting to Stripe
      if (tier === 'free') {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {API_BASE_URL && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">DEBUG MODE</p>
              <p className="text-sm text-yellow-700">
                Running in local development mode. You can instantly switch between plans without payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrentPlan = subscription?.tier === plan.tier && subscription.status === 'active';

          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border p-8 shadow-sm ${
                isCurrentPlan ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-200'
              }`}
            >
              {isCurrentPlan && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 px-3 py-1 text-sm font-semibold text-white rounded-full">
                  Current plan
                </span>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {plan.price === 0 ? 'Free' : `$${plan.price}/month`}
                </p>

                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-indigo-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={processing || isCurrentPlan}
                  className="mt-8 w-full"
                >
                  {isCurrentPlan ? 'Current plan' : 'Subscribe'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}