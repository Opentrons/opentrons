import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

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
