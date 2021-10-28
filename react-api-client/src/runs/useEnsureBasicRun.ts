import { useEffect } from 'react'
import { RunData, RUN_TYPE_BASIC } from '@opentrons/api-client'
import { useRunsByTypeQuery, useCreateRunMutation } from '.'

export function useEnsureBasicRun(): {
  data: RunData | null
  error: Error | null
} {
  const {
    data: existingBasicRuns,
    isLoading: isFetchingRun,
    isError: isGetRunError,
    error: getRunError,
  } = useRunsByTypeQuery({
    runType: RUN_TYPE_BASIC,
  })
  const {
    createRun,
    isLoading: isCreatingRun,
    isError: isCreateRunError,
    error: createSessionError,
  } = useCreateRunMutation({
    runType: RUN_TYPE_BASIC,
  })

  console.log(existingBasicRuns)

  useEffect(() => {
    if (
      (existingBasicRuns == null || existingBasicRuns[0] == null) &&
      !isFetchingRun &&
      !isCreatingRun &&
      !isCreateRunError &&
      !isGetRunError
    ) {
      createRun()
    }
  }, [
    existingBasicRuns,
    isFetchingRun,
    isCreatingRun,
    createRun,
    isCreateRunError,
    isGetRunError,
  ])

  const basicRunData = existingBasicRuns && existingBasicRuns[0]

  if (isGetRunError) {
    return { data: null, error: getRunError }
  }
  if (isCreateRunError) {
    return { data: null, error: createSessionError }
  }
  return { data: basicRunData ?? null, error: null }
}
