import { createClient } from 'revenuecat-api-v2/client';

function getApiKey(): string {
  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) {
    throw new Error(
      'REVENUECAT_SECRET_API_KEY is not set. Get it from RevenueCat dashboard: Project Settings > API Keys (secret key).',
    );
  }
  return apiKey;
}

export async function getUncachableRevenueCatClient() {
  const apiKey = getApiKey();
  return createClient({
    baseUrl: 'https://api.revenuecat.com/v2',
    headers: { Authorization: 'Bearer ' + apiKey },
  });
}
