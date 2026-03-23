import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client. Use for data that comes from Supabase, Edge Functions,
 * or other sources — each useQuery/useMutation should provide its own queryFn/mutationFn.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
