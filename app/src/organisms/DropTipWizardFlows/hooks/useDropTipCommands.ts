import * as React from 'react'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'

import { MANAGED_PIPETTE_ID, POSITION_AND_BLOWOUT } from '../constants'
import { getAddressableAreaFromConfig } from '../getAddressableAreaFromConfig'
import { useNotifyDeckConfigurationQuery } from '../../../resources/deck_configuration'
import type {
  CreateCommand,
  AddressableAreaName,
  PipetteModelSpecs,
  DropTipInPlaceCreateCommand,
  UnsafeDropTipInPlaceCreateCommand,
} from '@opentrons/shared-data'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import type { CommandData, PipetteData } from '@opentrons/api-client'
import type { Axis, Sign, StepSize } from '../../../molecules/JogControls/types'
import type { DropTipFlowsStep, FixitCommandTypeUtils } from '../types'
import type { SetRobotErrorDetailsParams, UseDTWithTypeParams } from '.'
import type { RunCommandByCommandTypeParams } from './useDropTipCreateCommands'

const JOG_COMMAND_TIMEOUT_MS = 10000
const MAXIMUM_BLOWOUT_FLOW_RATE_UL_PER_S = 50

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
  /*  */
  handleCleanUpAndClose: (homeOnExit?: boolean) => Promise<void>
  moveToAddressableArea: (addressableArea: AddressableAreaName) => Promise<void>
  handleJog: (axis: Axis, dir: Sign, step: StepSize) => Promise<void>
  blowoutOrDropTip: (
    currentStep: DropTipFlowsStep,
    proceed: () => void
  ) => Promise<void>
  handleMustHome: () => Promise<void>
}

// Returns setup commands used in Drop Tip Wizard.
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
  const [hasSeenClose, setHasSeenClose] = React.useState(false)

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => {
      closeFlow()
    },
    onError: () => {
      closeFlow()
    },
  })
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
                deleteMaintenanceRun(activeMaintenanceRunId)
              })
          }
        }
      }
    })
  }

  const moveToAddressableArea = (
    addressableArea: AddressableAreaName
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const addressableAreaFromConfig = getAddressableAreaFromConfig(
        addressableArea,
        deckConfig,
        instrumentModelSpecs.channels,
        robotType
      )

      if (addressableAreaFromConfig != null) {
        const moveToAACommand = buildMoveToAACommand(addressableAreaFromConfig)
        return chainRunCommands(
          isFlex
            ? [UPDATE_ESTIMATORS_EXCEPT_PLUNGERS, moveToAACommand]
            : [moveToAACommand],
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

  const handleJog = (axis: Axis, dir: Sign, step: StepSize): Promise<void> => {
    return new Promise((resolve, reject) => {
      return runCommand({
        command: {
          commandType: 'moveRelative',
          params: { pipetteId: MANAGED_PIPETTE_ID, distance: step * dir, axis },
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

  const blowoutOrDropTip = (
    currentStep: DropTipFlowsStep,
    proceed: () => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      chainRunCommands(
        currentStep === POSITION_AND_BLOWOUT
          ? buildBlowoutCommands(instrumentModelSpecs, isFlex)
          : buildDropTipInPlaceCommand(isFlex),
        true
      )
        .then((commandData: CommandData[]) => {
          const error = commandData[0].data.error
          if (error != null) {
            if (
              fixitCommandTypeUtils != null &&
              issuedCommandsType === 'fixit'
            ) {
              if (currentStep === POSITION_AND_BLOWOUT) {
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
            if (currentStep === POSITION_AND_BLOWOUT) {
              fixitCommandTypeUtils.errorOverrides.blowoutFailed()
            } else {
              fixitCommandTypeUtils.errorOverrides.tipDropFailed()
            }
          }

          setErrorDetails({
            message: `Error issuing ${
              currentStep === POSITION_AND_BLOWOUT ? 'blowout' : 'drop tip'
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

const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}

const UPDATE_ESTIMATORS_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'unsafe/updatePositionEstimators' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}

const buildDropTipInPlaceCommand = (
  isFlex: boolean
): Array<DropTipInPlaceCreateCommand | UnsafeDropTipInPlaceCreateCommand> =>
  isFlex
    ? [
        {
          commandType: 'unsafe/dropTipInPlace',
          params: { pipetteId: MANAGED_PIPETTE_ID },
        },
      ]
    : [
        {
          commandType: 'dropTipInPlace',
          params: { pipetteId: MANAGED_PIPETTE_ID },
        },
      ]

const buildBlowoutCommands = (
  specs: PipetteModelSpecs,
  isFlex: boolean
): CreateCommand[] =>
  isFlex
    ? [
        {
          commandType: 'unsafe/blowOutInPlace',
          params: {
            pipetteId: MANAGED_PIPETTE_ID,
            flowRate: Math.min(
              specs.defaultBlowOutFlowRate.value,
              MAXIMUM_BLOWOUT_FLOW_RATE_UL_PER_S
            ),
          },
        },
        {
          commandType: 'prepareToAspirate',
          params: {
            pipetteId: MANAGED_PIPETTE_ID,
          },
        },
      ]
    : [
        {
          commandType: 'blowOutInPlace',
          params: {
            pipetteId: MANAGED_PIPETTE_ID,
            flowRate: specs.defaultBlowOutFlowRate.value,
          },
        },
      ]

const buildMoveToAACommand = (
  addressableAreaFromConfig: AddressableAreaName
): CreateCommand => {
  return {
    commandType: 'moveToAddressableArea',
    params: {
      pipetteId: MANAGED_PIPETTE_ID,
      stayAtHighestPossibleZ: true,
      addressableAreaName: addressableAreaFromConfig,
      offset: { x: 0, y: 0, z: 0 },
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
