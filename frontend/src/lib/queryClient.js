import { QueryClient } from '@tanstack/react-query';

// Shared React Query client. Conservative defaults because live auction data is
// driven by sockets — we don't want aggressive background refetching.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
