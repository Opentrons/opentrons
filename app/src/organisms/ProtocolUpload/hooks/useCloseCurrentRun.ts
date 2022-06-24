import * as React from 'react'
import { useParams } from 'react-router-dom'

import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'
import {
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
} from '../../Devices/hooks'

import type { UseDismissCurrentRunMutationOptions } from '@opentrons/react-api-client/src/runs/useDismissCurrentRunMutation'
import type { NavRouteParams } from '../../../App/types'

type CloseCallback = (options?: UseDismissCurrentRunMutationOptions) => void

export function useCloseCurrentRun(): {
  closeCurrentRun: CloseCallback
  isClosingCurrentRun: boolean
} {
  const currentRunId = useCurrentRunId()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(currentRunId)
  const { robotName } = useParams<NavRouteParams>()
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const {
    dismissCurrentRun,
    isLoading: isDismissing,
  } = useDismissCurrentRunMutation()

  const closeCurrentRun = (
    options?: UseDismissCurrentRunMutationOptions
  ): void => {
    if (currentRunId != null) {
      dismissCurrentRun(currentRunId, {
        ...options,
        onError: () => console.warn('failed to dismiss current'),
      })

      trackProtocolRunEvent({
        name: 'runFinish',
        properties: {
          ...robotAnalyticsData,
        },
      }).catch(e =>
        console.log(
          `Error tracking protocol run runFinish event: ${(e as Error).message}`
        )
      )
    }
  }

  const closeCurrentRunCallback = React.useCallback(closeCurrentRun, [
    dismissCurrentRun,
    currentRunId,
    robotAnalyticsData,
  ])

  return {
    closeCurrentRun: closeCurrentRunCallback,
    isClosingCurrentRun: isDismissing,
  }
}
