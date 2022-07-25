import { useAllSessionsQuery } from '@opentrons/react-api-client'

export function useIsLegacySessionInProgress(): Boolean {
  const allSessionsQueryResponse = useAllSessionsQuery()

  return (
    allSessionsQueryResponse?.data?.data != null &&
    allSessionsQueryResponse?.data?.data?.length !== 0
  )
}
