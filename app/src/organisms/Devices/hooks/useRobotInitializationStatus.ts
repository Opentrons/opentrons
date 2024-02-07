import * as React from 'react'

import { useHealthQuery } from '@opentrons/react-api-client'

const ROBOT_HEALTH_POLL_MS = 5000

export const INIT_STATUS = {
  INITIALIZING: 'INITIALIZING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const

type RobotInitializationStatus =
  | typeof INIT_STATUS[keyof typeof INIT_STATUS]
  | null

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
      status = INIT_STATUS.INITIALIZING
      break
    case 200:
      status = INIT_STATUS.SUCCEEDED
      break
    case 500:
      status = INIT_STATUS.FAILED
      break
    default:
      status = null
      break
  }

  return status
}
