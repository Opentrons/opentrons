import { useNotifyRunQuery } from './useNotifyRunQuery'

const CURRENT_RUN_POLL_MS = 5000

export function useIsRunCurrent(runId: string | null): boolean {
  return Boolean(
    useNotifyRunQuery(runId, { refetchInterval: CURRENT_RUN_POLL_MS })?.data
      ?.data?.current
  )
}
