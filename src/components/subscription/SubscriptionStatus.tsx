import { CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSubscription } from '../../hooks/useSubscription';

export function SubscriptionStatus() {
  const { subscription, loading, error, cancelSubscription } = useSubscription();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!subscription) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription Status</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Your {subscription.tier} plan is {subscription.status}.
                {subscription.status === 'active' && (
                  <span>
                    {' '}
                    Current period ends on {formatDate(subscription.current_period_end)}.
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex sm:flex-shrink-0 sm:items-center">
            {subscription.status === 'active' ? (
              <CreditCard className="h-6 w-6 text-green-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            )}
          </div>
        </div>

        {subscription.status === 'active' && (
          <div className="mt-5">
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel your subscription?')) {
                  cancelSubscription();
                }
              }}
            >
              Cancel Subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}