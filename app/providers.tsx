"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { Provider as JotaiProvider } from "jotai";

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 15, // 15 minutes
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <ReactQueryStreamedHydration>
          {props.children}
        </ReactQueryStreamedHydration>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
