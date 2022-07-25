import { useAllSessionsQuery } from '@opentrons/react-api-client'

export function useIsLegacySessionInProgress(): Boolean {
  const allSessionsQueryResponse = useAllSessionsQuery()

  const isLegacySessionInProgress =
    allSessionsQueryResponse?.data?.data != null &&
    allSessionsQueryResponse?.data?.data?.length !== 0

  return isLegacySessionInProgress
}
