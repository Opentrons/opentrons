import { QueryClient, QueryClientProvider } from 'react-query'

import type * as React from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export interface ApiClientProviderProps {
  children?: React.ReactNode
}

export function ApiClientProvider(props: ApiClientProviderProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}
