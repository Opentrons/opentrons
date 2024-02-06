import * as React from 'react'

import { useHealthQuery } from '@opentrons/react-api-client'

const ROBOT_HEALTH_POLL_MS = 5000

type RobotInitializationStatus = 'INITIALIZING' | 'SUCCEEDED' | 'FAILED' | null

export function useRobotInitializationStatus(): RobotInitializationStatus {
  const responseStatusCode = React.useRef<number | null>(null)

  useHealthQuery({
    refetchInterval: ROBOT_HEALTH_POLL_MS,
    onSuccess: data => (responseStatusCode.current = data?.status ?? null),
    onError: error =>
      (responseStatusCode.current = error.response?.status ?? null),
  })

  let status: RobotInitializationStatus
  switch (responseStatusCode.current) {
    case 503:
      status = 'INITIALIZING'
      break
    case 200:
      status = 'SUCCEEDED'
      break
    case 500:
      status = 'FAILED'
      break
    default:
      status = null
      break
  }

  return status
}
