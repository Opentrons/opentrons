import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import {
  HostConfig,
  createCommand, // TODO: create hook for this inside react-api-client
  RunCommandSummary,
} from '@opentrons/api-client'
import { useHost, useAllCommandsQuery } from '@opentrons/react-api-client'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { useCurrentProtocolRun } from '../../../ProtocolUpload/useCurrentProtocolRun'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { getModuleLocation } from '../../utils/getModuleLocation'
import { useLPCCommands } from './useLPCCommands'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { SetupCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../../../molecules/JogControls/types'
import type {
  LabwarePositionCheckCommand,
  LabwarePositionCheckMovementCommand,
} from '../types'

export type LabwarePositionCheckUtils =
  | {
      currentCommandIndex: number
      loadingText: string | null
      isComplete: boolean
      beginLPC: () => void
      proceed: () => void
      jog: Jog
      ctaText: string
    }
  | { error: Error }

const useLpcCtaText = (command: LabwarePositionCheckCommand): string => {
  const { protocolData } = useProtocolDetails()
  const { t } = useTranslation('labware_position_check')
  const commands = protocolData?.commands ?? []
  switch (command.commandType) {
    case 'dropTip':
    case 'moveToWell': {
      const labwareId = command.params.labwareId
      const slot = getLabwareLocation(labwareId, commands)
      return t('confirm_position_and_move', {
        next_slot: slot,
      })
    }
    case 'thermocycler/openLid': {
      const moduleId = command.params.moduleId
      const slot = getModuleLocation(moduleId, commands)
      return t('confirm_position_and_move', {
        next_slot: slot,
      })
    }
    case 'pickUpTip': {
      return t('confirm_position_and_pick_up_tip')
    }
  }
}

const useLoadingText = (
  loading: boolean,
  command: LabwarePositionCheckMovementCommand
): string | null => {
  const { protocolData } = useProtocolDetails()
  const { t } = useTranslation('labware_position_check')

  if (loading) {
    return null
  }
  const commands = protocolData?.commands ?? []

  const labwareId = command.params.labwareId
  const slot = getLabwareLocation(labwareId, commands)

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
}

const commandIsComplete = (status: RunCommandSummary['status']): boolean =>
  status === 'succeeded' || status === 'failed'

const createCommandData = (
  command: Command | LabwarePositionCheckCommand
): { commandType: string; data: Record<string, any> } => ({
  commandType: command.commandType,
  data: command.params,
})

const isLoadCommand = (command: Command): boolean => {
  const loadCommands: Array<SetupCommand['commandType']> = [
    'loadLabware',
    'loadLiquid',
    'loadModule',
    'loadPipette',
  ]
  // @ts-expect-error SetupCommand is more specific than Command, but the whole point of this util :)
  return loadCommands.includes(command.commandType)
}

const isTCOpenCommand = (command: Command): boolean =>
  command.commandType === 'thermocycler/openLid'

export function useLabwarePositionCheck(
  addSavePositionCommandData: (commandId: string, labwareId: string) => void
): LabwarePositionCheckUtils {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [
    pendingMovementCommandData,
    setPendingMovementCommandData,
  ] = React.useState<{
    commandId: string
    pipetteId: string
    labwareId: string
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<Error | null>(null)
  const { protocolData } = useProtocolDetails()
  const host = useHost()
  const { runRecord: currentRun } = useCurrentProtocolRun()
  // load commands come from the protocol resource
  const loadCommands = protocolData?.commands.filter(isLoadCommand) ?? []
  // TC open lid commands come from the LPC command generator
  const TCOpenCommands = useLPCCommands().filter(isTCOpenCommand) ?? []
  // prepCommands will be run when a user starts LPC
  const prepCommands = [...loadCommands, ...TCOpenCommands]
  // LPCMovementCommands will be run during the guided LPC flow
  const LPCMovementCommands: LabwarePositionCheckMovementCommand[] = useLPCCommands().filter(
    (
      command: LabwarePositionCheckCommand
    ): command is LabwarePositionCheckMovementCommand =>
      command.commandType !== 'thermocycler/openLid'
  )
  const currentCommand = LPCMovementCommands[currentCommandIndex]
  const ctaText = useLpcCtaText(currentCommand)
  const robotCommands = useAllCommandsQuery(currentRun?.data?.id).data?.data
  const loadingText = useLoadingText(isLoading, currentCommand)
  const isComplete = currentCommandIndex === LPCMovementCommands.length
  if (error != null) return { error }
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
    } else {
      // the movement command is complete, save its position for use later
      const savePositionCommand: Command = {
        commandType: 'savePosition',
        id: uuidv4(),
        params: { pipetteId: pendingMovementCommandData.pipetteId },
      }
      createCommand(
        host as HostConfig,
        currentRun?.data?.id as string,
        createCommandData(savePositionCommand)
      )
        .then(response => {
          const commandId = response.data.data.id
          addSavePositionCommandData(
            commandId,
            pendingMovementCommandData.labwareId
          )
        })
        .catch((e: Error) => {
          console.error(`error issuing command to robot: ${e.message}`)
          setIsLoading(false)
          setError(e)
        })
      setIsLoading(false)
      setPendingMovementCommandData(null)
    }
  }

  const proceed = (): void => {
    const prevCommand = LPCMovementCommands[currentCommandIndex - 1]
    setIsLoading(true)
    // before executing the next movement command, save the current position
    const savePositionCommand: Command = {
      commandType: 'savePosition',
      id: uuidv4(),
      params: { pipetteId: prevCommand.params.pipetteId },
    }
    createCommand(
      host as HostConfig,
      currentRun?.data?.id as string,
      createCommandData(savePositionCommand)
    )
      // add the saved command id so we can use it to query locations later
      .then(response => {
        const commandId = response.data.data.id
        addSavePositionCommandData(commandId, prevCommand.params.labwareId)
        // execute the movement command
        return createCommand(
          host as HostConfig,
          currentRun?.data?.id as string,
          createCommandData(currentCommand)
        )
      })
      .then(response => {
        const commandId = response.data.data.id
        const pipetteId = currentCommand.params.pipetteId
        const labwareId: string = currentCommand.params.labwareId
        setPendingMovementCommandData({ commandId, pipetteId, labwareId })
        setCurrentCommandIndex(currentCommandIndex + 1)
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
  }

  const beginLPC = (): void => {
    setIsLoading(true)
    // execute prep commands
    prepCommands.forEach((prepCommand: Command) => {
      createCommand(
        host as HostConfig,
        currentRun?.data?.id as string,
        createCommandData(prepCommand)
      ).catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
    })
    // issue first movement command
    createCommand(
      host as HostConfig,
      currentRun?.data?.id as string,
      createCommandData(currentCommand)
    )
      .then(response => {
        const commandId = response.data.data.id
        setPendingMovementCommandData({
          commandId,
          labwareId: currentCommand.params.labwareId,
          pipetteId: currentCommand.params.pipetteId,
        })
        setCurrentCommandIndex(currentCommandIndex + 1)
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    const data = {
      commandType: 'moveRelative',
      data: {
        pipetteId: currentCommand.params.pipetteId,
        distance: step * dir,
        axis,
      },
    }

    createCommand(
      host as HostConfig,
      currentRun?.data?.id as string,
      data
    ).catch((e: Error) => {
      setError(e)
      console.error(`error issuing jog command: ${e.message}`)
    })
  }

  return {
    currentCommandIndex,
    loadingText,
    beginLPC,
    proceed,
    jog,
    ctaText,
    isComplete,
  }
}
