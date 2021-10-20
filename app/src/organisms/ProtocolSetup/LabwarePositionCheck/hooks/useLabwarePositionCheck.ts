import * as React from 'react'
import {
  createCommand,
  HostConfig,
  SessionCommandSummary,
} from '@opentrons/api-client'
import {
  useHost,
  useEnsureBasicSession,
  useAllCommandsQuery,
} from '@opentrons/react-api-client'
import { useSteps } from '.'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../../../molecules/JogControls/types'
import { useProtocolDetails } from '../../../RunDetails/hooks'

interface LabwarePositionCheckUtils {
  currentCommandIndex: number
  isLoading: boolean
  isComplete: boolean
  proceed: () => void
  jog: Jog
  ctaText: string
}

const useLpcCtaText = (command: Command): string => {
  const { protocolData } = useProtocolDetails()
  switch (command.command) {
    case 'moveToWell': {
      const labwareId = command.params.labware
      const slot = protocolData?.labware[labwareId].slot
      return `Confirm position, move to slot ${slot}`
    }
    case 'thermocycler/openLid': {
      const moduleId = command.params.module
      const slot = protocolData?.modules[moduleId].slot
      return `Confirm position, move to slot ${slot}`
    }
    case 'pickUpTip': {
      return `Confirm position, pick up tip`
    }
    case 'dropTip': {
      const labwareId = command.params.labware
      const slot = protocolData?.labware[labwareId].slot
      return `Confirm position, return tip to slot ${slot}`
    }
    default:
      return ''
  }
}

const commandIsComplete = (status: SessionCommandSummary['status']): boolean =>
  status === 'succeeded' || status === 'failed'

const createCommandData = (
  command: Command
): { commandType: string; data: Record<string, any> } => ({
  commandType: command.command,
  data: command.params,
})

export function useLabwarePositionCheck(
  proceedToSummary: () => unknown,
  addSavePositionCommandId: (commandId: string) => void
): LabwarePositionCheckUtils {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [pendingCommandId, setPendingCommandId] = React.useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const host = useHost()
  const basicSession = useEnsureBasicSession()
  const LPCCommands = useSteps().reduce<Command[]>((steps, currentStep) => {
    return [...steps, ...currentStep.commands]
  }, [])
  const currentCommand = LPCCommands[currentCommandIndex]
  const ctaText = useLpcCtaText(currentCommand)
  const robotCommands = useAllCommandsQuery(basicSession?.id).data?.data
  if (basicSession == null)
    return {
      isLoading: false,
      currentCommandIndex: currentCommandIndex,
      proceed: () => null,
      jog: () => null,
      ctaText,
      isComplete: false,
    }
  if (
    pendingCommandId != null &&
    Boolean(
      robotCommands?.find(
        command =>
          command.id === pendingCommandId && commandIsComplete(command.status)
      )
    )
  ) {
    setIsLoading(false)
    setPendingCommandId(null)
  }

  const proceed = (): void => {
    console.log('proceeding!')
    setIsLoading(true)

    createCommand(
      host as HostConfig,
      basicSession.id,
      createCommandData(currentCommand)
    )
      .then(response => {
        const commandId = response.data.data.id
        // @ts-expect-error delete this when schema v6 types are out
        if (currentCommand.command === 'savePosition') {
          addSavePositionCommandId(commandId)
        }

        // execute the next moveToWell command if opening TC lid
        if (currentCommand.command === 'thermocycler/openLid') {
          const nextCommand = LPCCommands[currentCommandIndex + 1]
          createCommand(
            host as HostConfig,
            basicSession.id,
            createCommandData(nextCommand)
          )
            .then(response => {
              const commandId = response.data.data.id
              setPendingCommandId(commandId)
              // incremement currentCommandIndex by 2 since we've executed 2 commands
              setCurrentCommandIndex(currentCommandIndex + 2)
            })
            .catch(e => {
              console.error(`error issuing command to robot: ${e}`)
              setIsLoading(false)
            })
        } else {
          setPendingCommandId(commandId)
          setCurrentCommandIndex(currentCommandIndex + 1)
        }
      })
      .catch(e => {
        console.error(`error issuing command to robot: ${e}`)
        setIsLoading(false)
      })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    const data = {
      commandType: 'moveRelative',
      data: {
        // @ts-expect-error TODO IMMEDIATELY: add pipette id to top level command object
        pipetteId: currentCommand.params.pipetteId,
        distance: step,
        axis,
      },
    }

    createCommand(host as HostConfig, basicSession.id, data).catch(e =>
      console.error(`error issuing jog command: ${e}`)
    )
  }

  return {
    currentCommandIndex,
    isLoading,
    proceed,
    jog,
    ctaText,
    isComplete: false,
  }
}
