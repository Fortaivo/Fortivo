import { SubscriptionPlans } from '../components/subscription/SubscriptionPlans';
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus';

export function SubscriptionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscription</h1>
      
      <div className="space-y-8">
        <SubscriptionStatus />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
          <SubscriptionPlans />
        </div>
      </div>
    </div>
  );
}