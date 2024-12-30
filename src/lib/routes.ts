export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  ASSETS: '/assets',
  BENEFICIARIES: '/beneficiaries',
  DOCUMENTS: '/assets/:assetId/documents',
  SUBSCRIPTION: '/subscription',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    RESET_PASSWORD: '/auth/reset-password',
    CALLBACK: '/auth/callback',
  },
} as const;