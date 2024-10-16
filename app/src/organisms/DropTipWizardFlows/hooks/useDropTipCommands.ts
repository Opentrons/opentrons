import { useState, useEffect } from 'react'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'

import { DT_ROUTES, MANAGED_PIPETTE_ID } from '../constants'
import { getAddressableAreaFromConfig } from '../utils'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import type {
  CreateCommand,
  AddressableAreaName,
  PipetteModelSpecs,
} from '@opentrons/shared-data'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import type { CommandData, PipetteData } from '@opentrons/api-client'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { DropTipFlowsRoute, FixitCommandTypeUtils } from '../types'
import type { SetRobotErrorDetailsParams, UseDTWithTypeParams } from '.'
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
}

export interface UseDropTipCommandsResult {
  handleCleanUpAndClose: (homeOnExit?: boolean) => Promise<void>
  moveToAddressableArea: (
    addressableArea: AddressableAreaName,
    stayAtHighestPossibleZ?: boolean
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
}: UseDropTipSetupCommandsParams): UseDropTipCommandsResult {
  const isFlex = robotType === FLEX_ROBOT_TYPE
  const [hasSeenClose, setHasSeenClose] = useState(false)
  const [jogQueue, setJogQueue] = useState<Array<() => Promise<void>>>([])
  const [isJogging, setIsJogging] = useState(false)
  const pipetteId = fixitCommandTypeUtils?.pipetteId ?? null

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()
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
    stayAtHighestPossibleZ = true // Generally false when moving to a waste chute or trash bin.
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const addressableAreaFromConfig = getAddressableAreaFromConfig(
        addressableArea,
        deckConfig,
        instrumentModelSpecs.channels,
        robotType
      )

      if (addressableAreaFromConfig != null) {
        const moveToAACommand = buildMoveToAACommand(
          addressableAreaFromConfig,
          pipetteId,
          stayAtHighestPossibleZ
        )
        return chainRunCommands(
          isFlex
            ? [
                ENGAGE_AXES,
                UPDATE_ESTIMATORS_EXCEPT_PLUNGERS,
                Z_HOME,
                moveToAACommand,
              ]
            : [Z_HOME, moveToAACommand],
          true
        )
          .then((commandData: CommandData[]) => {
            const error = commandData[0].data.error
            if (error != null) {
              setErrorDetails({
                runCommandError: error,
                message: `Error moving to position: ${error.detail}`,
              })
            }
          })
          .then(resolve)
          .catch(error => {
            if (
              fixitCommandTypeUtils != null &&
              issuedCommandsType === 'fixit'
            ) {
              fixitCommandTypeUtils.errorOverrides.generalFailure()
            }

            reject(
              new Error(`Error issuing move to addressable area: ${error}`)
            )
          })
      } else {
        setErrorDetails({
          message: `Error moving to position: invalid addressable area.`,
        })
      }
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

  useEffect(() => {
    processJogQueue()
  }, [jogQueue.length, isJogging])

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
      chainRunCommands(
        currentRoute === DT_ROUTES.BLOWOUT
          ? buildBlowoutCommands(instrumentModelSpecs, isFlex, pipetteId)
          : buildDropTipInPlaceCommand(isFlex, pipetteId),
        true
      )
        .then((commandData: CommandData[]) => {
          const error = commandData[0].data.error
          if (error != null) {
            if (
              fixitCommandTypeUtils != null &&
              issuedCommandsType === 'fixit'
            ) {
              if (currentRoute === DT_ROUTES.BLOWOUT) {
                fixitCommandTypeUtils.errorOverrides.blowoutFailed()
              } else {
                fixitCommandTypeUtils.errorOverrides.tipDropFailed()
              }
            }

            setErrorDetails({
              runCommandError: error,
              message: `Error moving to position: ${error.detail}`,
            })
          } else {
            proceed()
            resolve()
          }
        })
        .catch((error: Error) => {
          if (fixitCommandTypeUtils != null && issuedCommandsType === 'fixit') {
            if (currentRoute === DT_ROUTES.BLOWOUT) {
              fixitCommandTypeUtils.errorOverrides.blowoutFailed()
            } else {
              fixitCommandTypeUtils.errorOverrides.tipDropFailed()
            }
          }

          setErrorDetails({
            message: `Error issuing ${
              currentRoute === DT_ROUTES.BLOWOUT ? 'blowout' : 'drop tip'
            } command: ${error.message}`,
          })
          resolve()
        })
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
        ENGAGE_AXES,
        UPDATE_PLUNGER_ESTIMATORS,
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
        {
          commandType: 'prepareToAspirate',
          params: {
            pipetteId: pipetteId ?? MANAGED_PIPETTE_ID,
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
  stayAtHighestPossibleZ: boolean
): CreateCommand => {
  // Because we can never be certain about which tip is attached outside a protocol run, always assume the most
  // conservative estimate, a 1000ul tip.
  const zOffset = stayAtHighestPossibleZ ? 0 : 88
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
