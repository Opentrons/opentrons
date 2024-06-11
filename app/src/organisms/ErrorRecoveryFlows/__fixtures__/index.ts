import { RECOVERY_MAP } from '../constants'

import type { FailedCommand, RecoveryContentProps } from '../types'

export const mockFailedCommand: FailedCommand = {
  commandType: 'pickUpTip',
  completedAt: '2024-05-24T13:55:32.595751+00:00',
  createdAt: '2024-05-24T13:55:19.014871+00:00',
  status: 'failed',
  key: '28d6daa63cc6d88bd8e3f0ababff79c3',
  error: {
    createdAt: '2024-05-24T13:55:32.595751+00:00',
    detail: 'No tip detected.',
    isDefined: false,
    errorCode: '3003',
    errorType: 'tipPhysicallyMissing',
    errorInfo: {},
    wrappedErrors: [],
    id: '123',
  },
  startedAt: '2024-05-24T13:55:19.016799+00:00',
  id: '1',
  params: {
    labwareId: '58774227-2413-40aa-957e-271ab7807927',
    pipetteId: '3d471ffa-0b6b-45f9-86ce-4d0fe2c25fdc',
    wellLocation: {
      offset: { x: 0, y: 0, z: 0 },
      origin: 'top',
    },
    wellName: 'A1',
  },
  notes: [],
}

export const mockRecoveryContentProps: RecoveryContentProps = {
  failedCommand: mockFailedCommand,
  errorKind: 'GENERAL_ERROR',
  isOnDevice: true,
  recoveryMap: {
    route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
  },
  routeUpdateActions: {} as any,
  recoveryCommands: {} as any,
  hasLaunchedRecovery: true,
} as any
