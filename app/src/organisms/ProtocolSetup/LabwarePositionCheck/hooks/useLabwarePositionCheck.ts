import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import isEqual from 'lodash/isEqual'
import { getCommand } from '@opentrons/api-client'
import {
  getLabwareDisplayName,
  IDENTITY_VECTOR,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  useHost,
  useCreateLabwareOffsetMutation,
  useCreateCommandMutation,
} from '@opentrons/react-api-client'
import { useTrackEvent } from '../../../../redux/analytics'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import {
  useCurrentRunId,
  useCurrentRunCommands,
} from '../../../ProtocolUpload/hooks'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import {
  sendModuleCommand,
  getAttachedModulesForConnectedRobot,
} from '../../../../redux/modules'
import { getConnectedRobotName } from '../../../../redux/robot/selectors'
import { getLabwareDefinitionUri } from '../../utils/getLabwareDefinitionUri'
import { getModuleInitialLoadInfo } from '../../utils/getModuleInitialLoadInfo'
import { getLabwareOffsetLocation } from '../../utils/getLabwareOffsetLocation'
import { useSteps } from './useSteps'
import type {
  HostConfig,
  RunCommandSummary,
  VectorOffset,
  LabwareOffsetCreateData,
} from '@opentrons/api-client'
import type {
  CreateCommand,
  ProtocolFile,
  RunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  SetupCreateCommand,
  SetupRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { DropTipCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { TCOpenLidCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  HomeCreateCommand,
  SavePositionCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../../../molecules/JogControls/types'
import type {
  LabwarePositionCheckCreateCommand,
  LabwarePositionCheckMovementCommand,
  LabwarePositionCheckStep,
  SavePositionCommandData,
} from '../types'

export type LabwarePositionCheckUtils =
  | {
      currentCommandIndex: number
      currentStep: LabwarePositionCheckStep
      titleText: string
      isLoading: boolean
      showPickUpTipConfirmationModal: boolean
      isComplete: boolean
      beginLPC: () => void
      proceed: () => void
      onUnsuccessfulPickUpTip: () => void
      jog: Jog
      ctaText: string
    }
  | { error: Error }

type LPCPrepCommand =
  | HomeCreateCommand
  | SetupRunTimeCommand
  | TCOpenLidCreateCommand

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds

const useLpcCtaText = (command: LabwarePositionCheckCreateCommand): string => {
  const { protocolData } = useProtocolDetails()
  const { t } = useTranslation('labware_position_check')
  if (command == null) return ''
  const commands = protocolData?.commands ?? []
  switch (command.commandType) {
    case 'dropTip':
      return t('confirm_position_and_return_tip')
    case 'moveToWell': {
      const labwareId = command.params.labwareId
      const labwareLocation = getLabwareLocation(labwareId, commands)
      return t('confirm_position_and_move', {
        next_slot:
          'slotName' in labwareLocation
            ? labwareLocation.slotName
            : getModuleInitialLoadInfo(labwareLocation.moduleId, commands)
                .location.slotName,
      })
    }
    case 'thermocycler/openLid': {
      const moduleId = command.params.moduleId
      const slot = getModuleInitialLoadInfo(moduleId, commands).location
        .slotName
      return t('confirm_position_and_move', {
        next_slot: slot,
      })
    }
    case 'pickUpTip': {
      return t('confirm_position_and_pick_up_tip')
    }
  }
}

export const useTitleText = (
  loading: boolean,
  command: LabwarePositionCheckMovementCommand,
  labware?: ProtocolFile<{}>['labware'],
  labwareDefinitions?: ProtocolFile<{}>['labwareDefinitions']
): string => {
  const { protocolData } = useProtocolDetails()
  const { t } = useTranslation('labware_position_check')

  if (command == null) {
    return ''
  }

  const commands = protocolData?.commands ?? []

  const labwareId = command.params.labwareId
  const labwareLocation = getLabwareLocation(labwareId, commands)
  const slot =
    'slotName' in labwareLocation
      ? labwareLocation.slotName
      : getModuleInitialLoadInfo(labwareLocation.moduleId, commands).location
          .slotName

  if (loading) {
    switch (command.commandType) {
      case 'moveToWell': {
        return t('moving_to_slot_title', {
          slot,
        })
      }
      case 'pickUpTip': {
        return t('picking_up_tip_title', {
          slot,
        })
      }
      case 'dropTip': {
        return t('returning_tip_title', {
          slot,
        })
      }
    }
  } else {
    if (labware == null || labwareDefinitions == null) return ''

    const labwareDefId = labware[labwareId].definitionId
    const labwareDisplayName = getLabwareDisplayName(
      labwareDefinitions[labwareDefId]
    )
    return t('check_labware_in_slot_title', {
      labware_display_name: labwareDisplayName,
      slot,
    })
  }
}

const commandIsComplete = (status: RunCommandSummary['status']): boolean =>
  status === 'succeeded' || status === 'failed'

const createCommandData = (
  command:
    | LabwarePositionCheckMovementCommand
    | LPCPrepCommand
    | SavePositionCreateCommand
): CreateCommand => {
  if (command.commandType === 'loadLabware') {
    return {
      commandType: command.commandType,
      params: { ...command.params, labwareId: command.result.labwareId },
    }
  }
  return { ...command }
}

const isLoadCommand = (
  command: RunTimeCommand
): command is SetupRunTimeCommand => {
  const loadCommands: Array<SetupCreateCommand['commandType']> = [
    'loadLabware',
    'loadLiquid',
    'loadModule',
    'loadPipette',
  ]
  // @ts-expect-error SetupCommand is more specific than Command, but the whole point of this util :)
  return loadCommands.includes(command.commandType)
}

const isTCOpenCommand = (
  command: CreateCommand
): command is TCOpenLidCreateCommand =>
  command.commandType === 'thermocycler/openLid'

export function useLabwarePositionCheck(
  addSavePositionCommandData: (commandId: string, labwareId: string) => void,
  savePositionCommandData: SavePositionCommandData
): LabwarePositionCheckUtils {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [
    pendingMovementCommandData,
    setPendingMovementCommandData,
  ] = React.useState<{
    commandId: string
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const isJogging = React.useRef<boolean>(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [
    showPickUpTipConfirmationModal,
    setShowPickUpTipConfirmationModal,
  ] = React.useState<boolean>(false)
  const [dropTipOffset, setDropTipOffset] = React.useState<VectorOffset>(
    IDENTITY_VECTOR
  )
  const { protocolData } = useProtocolDetails()
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const { createCommand } = useCreateCommandMutation()
  const host = useHost()
  const currentRunId = useCurrentRunId()
  const trackEvent = useTrackEvent()
  const LPCSteps = useSteps()
  const dispatch = useDispatch()
  const robotName = useSelector(getConnectedRobotName)
  const attachedModules = useSelector(getAttachedModulesForConnectedRobot)

  const LPCCommands = LPCSteps.reduce<LabwarePositionCheckCreateCommand[]>(
    (commands, currentStep) => {
      return [...commands, ...currentStep.commands]
    },
    []
  )
  // load commands come from the protocol resource
  const loadCommands: SetupRunTimeCommand[] =
    protocolData?.commands.filter(isLoadCommand).map(command => {
      if (command.commandType === 'loadPipette') {
        const commandWithPipetteId = {
          ...command,
          params: {
            ...command.params,
            pipetteId: command.result?.pipetteId,
          },
        }
        return commandWithPipetteId
      }
      return command
    }) ?? []
  // TC open lid commands come from the LPC command generator
  const TCOpenCommands = LPCCommands.filter(isTCOpenCommand) ?? []
  const homeCommand: HomeCreateCommand = {
    commandType: 'home',
    params: {},
  }
  // prepCommands will be run when a user starts LPC
  const prepCommands: LPCPrepCommand[] = [
    ...loadCommands,
    ...TCOpenCommands,
    homeCommand,
  ]
  // LPCMovementCommands will be run during the guided LPC flow
  const LPCMovementCommands: LabwarePositionCheckMovementCommand[] = LPCCommands.filter(
    (
      command: LabwarePositionCheckCreateCommand
    ): command is LabwarePositionCheckMovementCommand =>
      command.commandType !== 'thermocycler/openLid'
  )
  const currentCommand = LPCMovementCommands[currentCommandIndex]
  const prevCommand = LPCMovementCommands[currentCommandIndex - 1]

  const currentStep = LPCSteps.find(step => {
    const matchingCommand = step.commands.find(
      command => prevCommand != null && isEqual(command, prevCommand)
    )
    return matchingCommand
  }) as LabwarePositionCheckStep

  const ctaText = useLpcCtaText(currentCommand)
  const robotCommands = useCurrentRunCommands()
  const titleText = useTitleText(
    isLoading,
    prevCommand,
    protocolData?.labware,
    protocolData?.labwareDefinitions
  )
  if (
    prevCommand != null &&
    prevCommand.commandType === 'pickUpTip' &&
    !isLoading &&
    !showPickUpTipConfirmationModal
  ) {
    setShowPickUpTipConfirmationModal(true)
  }
  if (error != null) return { error }
  if (currentRunId == null)
    return {
      error: new Error(
        'No current run id found, cannot perform Labware Position Check without current run.'
      ),
    }

  const isComplete = currentCommandIndex === LPCMovementCommands.length
  const failedCommand = robotCommands?.find(
    command => command.status === 'failed'
  )
  if (failedCommand != null && error == null) {
    setError(
      new Error(
        `movement command with type ${failedCommand.commandType} and id ${failedCommand.id} failed on the robot`
      )
    )
  }
  const completedMovementCommand =
    pendingMovementCommandData != null &&
    robotCommands?.find(
      (command: RunCommandSummary) =>
        command.id === pendingMovementCommandData.commandId &&
        command.status != null &&
        commandIsComplete(command.status)
    )
  if (completedMovementCommand && pendingMovementCommandData) {
    // bail if the command failed
    if (completedMovementCommand.status === 'failed') {
      setError(
        new Error(
          `movement command id ${completedMovementCommand.id} failed on the robot`
        )
      )
    }
    setIsLoading(false)
    setPendingMovementCommandData(null)
  }

  // (sa 11-18-2021): refactor this function after beta release
  const proceed = (): void => {
    setIsLoading(true)
    setCurrentCommandIndex(currentCommandIndex + 1)
    setShowPickUpTipConfirmationModal(false)
    // before executing the next movement command, save the current position
    const savePositionCommand: CreateCommand = {
      commandType: 'savePosition',
      params: { pipetteId: prevCommand.params.pipetteId },
    }

    createCommand({
      runId: currentRunId,
      command: createCommandData(savePositionCommand),
    })
      .then(response => {
        if (prevCommand.commandType === 'moveToWell') {
          const commandId = response.data.id
          addSavePositionCommandData(commandId, prevCommand.params.labwareId)
        }
        // later in the promise chain we may need to incorporate in flight offsets into
        // pickup tip/drop tip commands, so we need to prepare those offset vectors

        // if this is the first labware that we are checking, no in flight offsets have been applied
        // return identity offsets and move on, they will no get used
        if (savePositionCommandData[currentCommand.params.labwareId] == null) {
          const positions = Promise.resolve([IDENTITY_VECTOR, IDENTITY_VECTOR])
          return positions
        }

        const prevSavePositionCommand = getCommand(
          host as HostConfig,
          currentRunId,
          response.data.id
        )

        const initialSavePositionCommandId =
          savePositionCommandData[currentCommand.params.labwareId][0]
        const initialSavePositionCommand = getCommand(
          host as HostConfig,
          currentRunId,
          initialSavePositionCommandId
        )
        const offsetFromPrevSavePositionCommand: Promise<VectorOffset> = prevSavePositionCommand.then(
          response => {
            return response.data.data.result.position
          }
        )
        const offsetFromInitialSavePositionCommand: Promise<VectorOffset> = initialSavePositionCommand.then(
          response => {
            return response.data.data.result.position
          }
        )
        const positions = Promise.all([
          offsetFromPrevSavePositionCommand,
          offsetFromInitialSavePositionCommand,
        ])
        return positions
      })
      .then(
        ([
          offsetFromPrevSavePositionCommand,
          offsetFromInitialSavePositionCommand,
        ]) => {
          // if the next command to execute is a pick up tip, we need to make sure
          // we pick up from the offset the user specified
          if (currentCommand.commandType === 'pickUpTip') {
            const {
              x: firstX,
              y: firstY,
              z: firstZ,
            } = offsetFromInitialSavePositionCommand
            const {
              x: secondX,
              y: secondY,
              z: secondZ,
            } = offsetFromPrevSavePositionCommand
            const offset = {
              x: secondX - firstX,
              y: secondY - firstY,
              z: secondZ - firstZ,
            }

            // save the offset to be used later by dropTip
            setDropTipOffset(offset)

            const wellLocation =
              currentCommand.params.wellLocation != null
                ? {
                    ...currentCommand.params.wellLocation,
                    offset,
                  }
                : { offset }
            currentCommand.params.wellLocation = wellLocation
          } else if (currentCommand.commandType === 'dropTip') {
            // apply in flight offsets to the drop tip command
            const wellLocation =
              currentCommand.params.wellLocation != null
                ? {
                    ...currentCommand.params.wellLocation,
                    offset: dropTipOffset,
                  }
                : { offset: dropTipOffset }
            currentCommand.params.wellLocation = wellLocation
          }
          // execute the movement command
          return createCommand({
            runId: currentRunId,
            command: createCommandData(currentCommand),
          })
        }
      )
      .then(response => {
        setPendingMovementCommandData({
          commandId: response.data.id,
        })
        // if the command is a movement command, save it's location after it completes
        if (currentCommand.commandType === 'moveToWell') {
          const savePositionCommand: SavePositionCreateCommand = {
            commandType: 'savePosition',
            params: { pipetteId: currentCommand.params.pipetteId },
          }
          createCommand({
            runId: currentRunId,
            command: createCommandData(savePositionCommand),
          })
            .then(response => {
              const commandId = response.data.id
              addSavePositionCommandData(
                commandId,
                currentCommand.params.labwareId
              )
            })
            .catch((e: Error) => {
              console.error(`error saving position: ${e.message}`)
              setError(e)
            })
        }
        // if this was the last LPC command, home the robot and log a mixpanel event
        if (currentCommandIndex === LPCMovementCommands.length - 1) {
          const homeCommand: HomeCreateCommand = {
            commandType: 'home',
            params: {},
          }
          createCommand({
            runId: currentRunId,
            command: createCommandData(homeCommand),
          })
            .then(() =>
              trackEvent({
                name: 'LabwarePositionCheckComplete',
                properties: {},
              })
            )
            .catch((e: Error) => {
              console.error(`error homing robot: ${e.message}`)
              setError(e)
            })
        }
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
  }

  const beginLPC = (): void => {
    trackEvent({ name: 'LabwarePositionCheckStarted', properties: {} })
    setIsLoading(true)
    // first clear all previous labware offsets for each labware
    const identityLabwareOffsets: LabwareOffsetCreateData[] =
      protocolData != null
        ? reduce<ProtocolFile<{}>['labware'], LabwareOffsetCreateData[]>(
            protocolData?.labware,
            (acc, _, labwareId) => {
              const identityOffset = {
                definitionUri: getLabwareDefinitionUri(
                  labwareId,
                  protocolData.labware,
                  protocolData.labwareDefinitions
                ),
                location: getLabwareOffsetLocation(
                  labwareId,
                  protocolData?.commands ?? [],
                  protocolData?.modules ?? {}
                ),
                vector: IDENTITY_VECTOR,
              }
              return [...acc, identityOffset]
            },
            []
          )
        : []

    identityLabwareOffsets.forEach(identityOffsetEntry => {
      createLabwareOffset({
        runId: currentRunId,
        data: identityOffsetEntry,
      }).catch((e: Error) => {
        console.error(`error clearing labware offsets: ${e.message}`)
        setError(e)
      })
    })

    // execute prep commands
    prepCommands.forEach(prepCommand => {
      // 11/18/21 intercept TCOpenLidCommand and use legacy modules endpoint
      // delete this once PE supports themocycler open lid command
      if (prepCommand.commandType === 'thermocycler/openLid') {
        const serial = attachedModules.find(
          module => module.type === THERMOCYCLER_MODULE_TYPE
        )?.serial
        if (serial == null) {
          throw new Error(
            'Expected to be able to find thermocycler serial number, but could not.'
          )
        }
        dispatch(sendModuleCommand(robotName as string, serial, 'open'))
      } else {
        createCommand({
          runId: currentRunId,
          command: createCommandData(prepCommand),
        }).catch((e: Error) => {
          console.error(`error issuing command to robot: ${e.message}`)
          setError(e)
        })
      }
    })
    // issue first movement command
    createCommand({
      runId: currentRunId,
      command: createCommandData(currentCommand),
    })
      .then(response => {
        const commandId = response.data.id
        setPendingMovementCommandData({
          commandId,
        })
        const savePositionCommand: SavePositionCreateCommand = {
          commandType: 'savePosition',
          params: { pipetteId: currentCommand.params.pipetteId },
        }
        createCommand({
          runId: currentRunId,
          command: createCommandData(savePositionCommand),
        }).then(response => {
          const commandId = response.data.id
          addSavePositionCommandData(commandId, currentCommand.params.labwareId)
        })
        setCurrentCommandIndex(currentCommandIndex + 1)
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
  }

  const onUnsuccessfulPickUpTip = (): void => {
    setIsLoading(true)
    setShowPickUpTipConfirmationModal(false)
    // drop the tip  back where it was before
    const commandType: DropTipCreateCommand['commandType'] = 'dropTip'
    const pipetteId = prevCommand.params.pipetteId
    const labwareId = prevCommand.params.labwareId
    const wellName = prevCommand.params.wellName
    const dropTipCommand: DropTipCreateCommand = {
      commandType,
      params: {
        pipetteId,
        labwareId,
        wellName,
      },
    }
    createCommand({
      runId: currentRunId,
      command: createCommandData(dropTipCommand),
    })
      .then(() => {
        const moveBackToWellCommand =
          // the last command was a pick up tip, the one before that was a move to well
          LPCMovementCommands[currentCommandIndex - 2]
        const moveBackToWell = createCommand({
          runId: currentRunId,
          command: createCommandData(moveBackToWellCommand),
        })
        return moveBackToWell
      })
      .then(response => {
        const commandId = response.data.id
        setPendingMovementCommandData({
          commandId,
        })
        // decrement current command index so that the state resets
        setCurrentCommandIndex(currentCommandIndex - 1)
      })

      .catch((e: Error) => {
        console.error(`error issuing drop tip command: ${e.message}`)
      })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    // if a jog is currently in flight, return early
    if (isJogging.current) return
    const moveRelCommand: CreateCommand = {
      commandType: 'moveRelative',
      params: {
        pipetteId: prevCommand.params.pipetteId,
        distance: step * dir,
        axis,
      },
    }
    isJogging.current = true
    createCommand({
      runId: currentRunId,
      command: moveRelCommand,
      waitUntilComplete: true,
      timeout: JOG_COMMAND_TIMEOUT,
    })
      .then(() => {
        isJogging.current = false
      })
      .catch((e: Error) => {
        isJogging.current = false
        setError(e)
        console.error(`error issuing jog command: ${e.message}`)
      })
  }

  return {
    currentCommandIndex,
    currentStep,
    beginLPC,
    proceed,
    jog,
    onUnsuccessfulPickUpTip,
    ctaText,
    isComplete,
    titleText,
    isLoading,
    showPickUpTipConfirmationModal,
  }
}
