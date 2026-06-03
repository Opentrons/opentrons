import { useEffect, useState } from 'react'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import {
  DROP_TIP_SPECIAL_ERROR_TYPES,
  DT_ROUTES,
  MANAGED_PIPETTE_ID,
} from '../constants'
import { getAddressableAreaFromConfig } from '../utils'

import type { CommandData, PipetteData } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type {
  AddressableAreaName,
  CreateCommand,
  PipetteModelSpecs,
  RunCommandError,
} from '@opentrons/shared-data'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { SetRobotErrorDetailsParams, UseDTWithTypeParams } from '.'
import type {
  DropTipFlowsRoute,
  FixitCommandTypeUtils,
  IssuedCommandsType,
} from '../types'
import type { RunCommandByCommandTypeParams } from './useDropTipCreateCommands'

const JOG_COMMAND_TIMEOUT_MS = 10000
const MAXIMUM_BLOWOUT_FLOW_RATE_UL_PER_S = 50
const MAX_QUEUED_JOGS = 3

type UseDropTipSetupCommandsParams = UseDTWithTypeParams & {
  activeMaintenanceRunId: string | null
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastFailure: boolean
  ) => Promise<CommandData[]>
  runCommand: (params: RunCommandByCommandTypeParams) => Promise<CommandData>
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
  toggleIsExiting: () => void
  fixitCommandTypeUtils?: FixitCommandTypeUtils
  deletionDocState: DocumentationState
  actionsToDocument: DocumentedAction[]
}

export interface UseDropTipCommandsResult {
  handleCleanUpAndClose: (homeOnExit?: boolean) => Promise<void>
  moveToAddressableArea: (
    addressableArea: AddressableAreaName,
    isPredefinedLocation: boolean // Is a predefined location in "choose location."
  ) => Promise<void>
  handleJog: (axis: Axis, dir: Sign, step: StepSize) => void
  blowoutOrDropTip: (
    currentRoute: DropTipFlowsRoute,
    proceed: () => void
  ) => Promise<void>
  handleMustHome: () => Promise<void>
}

export function useDropTipCommands({
  issuedCommandsType,
  toggleIsExiting,
  activeMaintenanceRunId,
  runCommand,
  chainRunCommands,
  closeFlow,
  setErrorDetails,
  instrumentModelSpecs,
  robotType,
  fixitCommandTypeUtils,
  deletionDocState,
  actionsToDocument,
}: UseDropTipSetupCommandsParams): UseDropTipCommandsResult {
  const isFlex = robotType === FLEX_ROBOT_TYPE
  const [hasSeenClose, setHasSeenClose] = useState(false)
  const [jogQueue, setJogQueue] = useState<Array<() => Promise<void>>>([])
  const [isJogging, setIsJogging] = useState(false)
  const pipetteId = fixitCommandTypeUtils?.pipetteId ?? null

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation(
    deletionDocState,
    [...actionsToDocument, 'end_drop_tips']
  )
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const handleCleanUpAndClose = (homeOnExit: boolean = true): Promise<void> => {
    return new Promise(() => {
      if (issuedCommandsType === 'fixit') {
        closeFlow()
        return Promise.resolve()
      } else {
        if (!hasSeenClose) {
          setHasSeenClose(true)
          toggleIsExiting()
          if (activeMaintenanceRunId == null) {
            closeFlow()
          } else {
            ;(homeOnExit
              ? chainRunCommands([HOME_EXCEPT_PLUNGERS], true)
              : Promise.resolve()
            )
              .catch((error: Error) => {
                console.error(error.message)
              })
              .finally(() => {
                deleteMaintenanceRun(activeMaintenanceRunId, {
                  onSettled: () => {
                    closeFlow()
                  },
                })
              })
          }
        }
      }
    })
  }

  const moveToAddressableArea = (
    addressableArea: AddressableAreaName,
    isPredefinedLocation: boolean
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          const addressableAreaFromConfig = getAddressableAreaFromConfig(
            addressableArea,
            deckConfig,
            instrumentModelSpecs.channels,
            robotType
          )

          if (addressableAreaFromConfig == null) {
            throw new Error('invalid addressable area.')
          }

          const moveToAACommand = buildMoveToAACommand(
            addressableAreaFromConfig,
            pipetteId,
            isPredefinedLocation,
            issuedCommandsType
          )

          if (isFlex) {
            return chainRunCommands(
              [ENGAGE_AXES, UPDATE_ESTIMATORS_EXCEPT_PLUNGERS],
              false
            )
              .catch(error => {
                // If one of the engage/estimator commands fails, we can safely assume it's because the position is
                // unknown, so show the special error modal.
                throw {
                  ...error,
                  errorType: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
                }
              })
              .then(() => {
                return chainRunCommands([Z_HOME, moveToAACommand], false)
              })
          } else {
            return chainRunCommands([Z_HOME, moveToAACommand], false)
          }
        })
        .then((commandData: CommandData[]) => {
          const error = commandData[0].data.error
          if (error != null) {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw error
          }
          resolve()
        })
        .catch((error: RunCommandError) => {
          if (fixitCommandTypeUtils != null && issuedCommandsType === 'fixit') {
            fixitCommandTypeUtils.errorOverrides.generalFailure()
          } else {
            setErrorDetails({
              type: error.errorType ?? null,
              message: error.detail
                ? `Error moving to position: ${error.detail}`
                : 'Error moving to position: invalid addressable area.',
            })
          }
          reject(error)
        })
    })
  }

  const executeJog = (axis: Axis, dir: Sign, step: StepSize): Promise<void> => {
    return new Promise((resolve, reject) => {
      return runCommand({
        command: {
          commandType: 'moveRelative',
          params: {
            pipetteId: pipetteId ?? MANAGED_PIPETTE_ID,
            distance: step * dir,
            axis,
          },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT_MS,
      })
        .then(() => {
          resolve()
        })
        .catch((error: Error) => {
          if (fixitCommandTypeUtils != null && issuedCommandsType === 'fixit') {
            fixitCommandTypeUtils.errorOverrides.generalFailure()
          }

          setErrorDetails({
            message: `Error issuing jog command: ${error.message}`,
          })
          resolve()
        })
    })
  }

  const processJogQueue = (): void => {
    if (jogQueue.length > 0 && !isJogging) {
      setIsJogging(true)
      const nextJog = jogQueue[0]
      setJogQueue(prevQueue => prevQueue.slice(1))
      nextJog().finally(() => {
        setIsJogging(false)
      })
    }
  }

  useEffect(
    () => {
      processJogQueue()
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jogQueue.length, isJogging]
  )

  const handleJog = (axis: Axis, dir: Sign, step: StepSize): void => {
    setJogQueue(prevQueue => {
      if (prevQueue.length < MAX_QUEUED_JOGS) {
        return [...prevQueue, () => executeJog(axis, dir, step)]
      }
      return prevQueue
    })
  }

  const blowoutOrDropTip = (
    currentRoute: DropTipFlowsRoute,
    proceed: () => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const isBlowoutRoute = currentRoute === DT_ROUTES.BLOWOUT

      const handleError = (error: RunCommandError | Error): void => {
        if (fixitCommandTypeUtils != null && issuedCommandsType === 'fixit') {
          isBlowoutRoute
            ? fixitCommandTypeUtils.errorOverrides.blowoutFailed()
            : fixitCommandTypeUtils.errorOverrides.tipDropFailed()
        } else {
          const operation = isBlowoutRoute ? 'blowout' : 'drop tip'
          const type = 'errorType' in error ? error.errorType : undefined
          const messageDetail =
            'message' in error ? error.message : error.detail

          setErrorDetails({
            type,
            message:
              messageDetail != null
                ? `Error during ${operation}: ${messageDetail}`
                : null,
          })
        }
        reject(error)
      }

      // Throw any errors in the response body if any.
      const handleSuccess = (commandData: CommandData[]): void => {
        const error = commandData[0].data.error
        if (error != null) {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw error
        }
        proceed()
        resolve()
      }

      // For Flex, we need extra preparation steps
      const prepareFlexBlowout = (): Promise<CommandData[]> => {
        return chainRunCommands(
          [ENGAGE_AXES, UPDATE_PLUNGER_ESTIMATORS],
          false
        ).catch(error => {
          throw {
            ...error,
            errorType: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
          }
        })
      }

      const executeCommands = (): Promise<CommandData[]> => {
        const commands = isBlowoutRoute
          ? buildBlowoutCommands(instrumentModelSpecs, isFlex, pipetteId)
          : buildDropTipInPlaceCommand(isFlex, pipetteId)

        return chainRunCommands(commands, false)
      }

      if (isBlowoutRoute && isFlex) {
        prepareFlexBlowout()
          .then(executeCommands)
          .then(handleSuccess)
          .catch(handleError)
      } else {
        executeCommands().then(handleSuccess).catch(handleError)
      }
    })
  }

  const handleMustHome = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      return chainRunCommands([HOME], true)
        .then(() => handleCleanUpAndClose())
        .then(resolve)
        .catch((error: Error) => {
          setErrorDetails({
            message: `Error homing ${error}`,
          })
          resolve()
        })
    })
  }

  return {
    handleCleanUpAndClose,
    moveToAddressableArea,
    handleJog,
    blowoutOrDropTip,
    handleMustHome,
  }
}

// Commands and command builders.

const HOME: CreateCommand = {
  commandType: 'home' as const,
  params: {},
}

const ENGAGE_AXES: CreateCommand = {
  commandType: 'unsafe/engageAxes' as const,
  params: {
    axes: ['leftZ', 'rightZ', 'x', 'y', 'leftPlunger', 'rightPlunger'],
  },
}

const Z_HOME: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ'] },
}

const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}

const UPDATE_ESTIMATORS_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'unsafe/updatePositionEstimators' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}

const UPDATE_PLUNGER_ESTIMATORS: CreateCommand = {
  commandType: 'unsafe/updatePositionEstimators' as const,
  params: { axes: ['leftPlunger', 'rightPlunger'] },
}

const buildDropTipInPlaceCommand = (
  isFlex: boolean,
  pipetteId: string | null
): CreateCommand[] =>
  isFlex
    ? [
        {
          commandType: 'unsafe/dropTipInPlace',
          params: { pipetteId: pipetteId ?? MANAGED_PIPETTE_ID },
        },
        Z_HOME,
      ]
    : [
        {
          commandType: 'dropTipInPlace',
          params: { pipetteId: pipetteId ?? MANAGED_PIPETTE_ID },
        },
        Z_HOME,
      ]

const buildBlowoutCommands = (
  specs: PipetteModelSpecs,
  isFlex: boolean,
  pipetteId: string | null
): CreateCommand[] =>
  isFlex
    ? [
        {
          commandType: 'unsafe/blowOutInPlace',
          params: {
            pipetteId: pipetteId ?? MANAGED_PIPETTE_ID,
            flowRate: Math.min(
              specs.defaultBlowOutFlowRate.value,
              MAXIMUM_BLOWOUT_FLOW_RATE_UL_PER_S
            ),
          },
        },
        Z_HOME,
      ]
    : [
        {
          commandType: 'blowOutInPlace',
          params: {
            pipetteId: pipetteId ?? MANAGED_PIPETTE_ID,
            flowRate: specs.defaultBlowOutFlowRate.value,
          },
        },
        Z_HOME,
      ]

const buildMoveToAACommand = (
  addressableAreaFromConfig: AddressableAreaName,
  pipetteId: string | null,
  isPredefinedLocation: boolean,
  commandType: IssuedCommandsType
): CreateCommand => {
  // Always ensure the user does all the jogging if choosing a custom location on the deck.
  const stayAtHighestPossibleZ = !isPredefinedLocation

  // Because we can never be certain about which tip is attached outside a protocol run, always assume the most
  // conservative estimate, a 1000ul tip.
  const zOffset = commandType === 'setup' && !stayAtHighestPossibleZ ? 88 : 0

  return {
    commandType: 'moveToAddressableArea',
    params: {
      pipetteId: pipetteId ?? MANAGED_PIPETTE_ID,
      stayAtHighestPossibleZ,
      addressableAreaName: addressableAreaFromConfig,
      offset: { x: 0, y: 0, z: zOffset },
    },
  }
}

export const buildLoadPipetteCommand = (
  pipetteName: PipetteModelSpecs['name'],
  mount: PipetteData['mount'],
  pipetteId?: string | null
): CreateCommand => {
  return {
    commandType: 'loadPipette',
    params: {
      pipetteId: pipetteId ?? MANAGED_PIPETTE_ID,
      mount,
      pipetteName,
    },
  }
}
