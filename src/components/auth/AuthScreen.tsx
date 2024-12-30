import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthScreenProps {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isLogin ? (
            <LoginForm
              onSuccess={onSuccess}
              onSwitch={() => setIsLogin(false)}
            />
          ) : (
            <SignupForm
              onSuccess={onSuccess}
              onSwitch={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import { Logo } from '../layout/Logo';