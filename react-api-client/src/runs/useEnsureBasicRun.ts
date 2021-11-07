import { useEffect } from 'react'
import { RunData, RUN_TYPE_BASIC } from '@opentrons/api-client'
import { useRunsByTypeQuery, useCreateRunMutation } from '.'

export function useEnsureBasicRun(): RunData | null {
  const { data: existingBasicRuns } = useRunsByTypeQuery({
    runType: RUN_TYPE_BASIC,
  })
  const { createRun, isLoading, isError } = useCreateRunMutation()

  useEffect(() => {
    if (existingBasicRuns == null && !isLoading && !isError) {
      createRun({
        runType: RUN_TYPE_BASIC,
      })
    }
  }, [existingBasicRuns, isLoading, createRun, isError])

  return existingBasicRuns?.data[0] ?? null
}
