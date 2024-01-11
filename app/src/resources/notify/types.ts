import type { UseQueryOptions } from 'react-query'

// TOME: Again, you want to use generics here.
export interface QueryOptionsWithPolling<TData, Error>
  extends UseQueryOptions<TData, Error> {
  forceHttpPolling?: boolean
}
