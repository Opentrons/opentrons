import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_START,
  SPACING,
  WRAP,
} from '@opentrons/components'
import { ModuleCard } from '../../ModuleCard'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../hooks'
import { useCreateCommandMutation } from '@opentrons/react-api-client'

import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { RunTimeCommand } from '@opentrons/shared-data'

interface ProtocolRunModuleControlsProps {
  robotName: string
  runId: string
}

export const ProtocolRunModuleControls = ({
  robotName,
  runId,
}: ProtocolRunModuleControlsProps): JSX.Element | null => {
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const attachedModules = Object.values(moduleRenderInfoForProtocolById).filter(
    module => module.attachedModuleMatch != null
  )

  const { protocolData } = useProtocolDetailsForRun(runId)
  const { createCommand } = useCreateCommandMutation()

  const loadCommands: LoadModuleRunTimeCommand[] =
    protocolData !== null
      ? protocolData?.commands.filter(
          (command: RunTimeCommand): command is LoadModuleRunTimeCommand =>
            command.commandType === 'loadModule'
        )
      : []

  React.useEffect(() => {
    if (protocolData != null) {
      const setupLoadCommands = loadCommands.map(command => {
        const commandWithModuleId = {
          ...command,
          params: {
            ...command.params,
            moduleId: command.result?.moduleId,
          },
        }
        return commandWithModuleId
      })

      setupLoadCommands.forEach(loadCommand => {
        createCommand({
          runId: runId,
          command: loadCommand,
        }).catch((e: Error) => {
          console.error(`error issuing command to robot: ${e.message}`)
        })
      })
    }
  }, [])

  return (
    <Flex
      width={attachedModules.length === 1 ? '100%' : '50%'}
      justifyContent={JUSTIFY_START}
      flexWrap={WRAP}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="25rem"
    >
      {attachedModules.map((module, index) => {
        return (
          <Flex
            marginTop={SPACING.spacing3}
            key={`moduleCard_${module.moduleDef.moduleType}_${index}`}
          >
            {module.attachedModuleMatch != null ? (
              <ModuleCard
                robotName={robotName}
                runId={runId}
                module={module.attachedModuleMatch}
                slotName={module.slotName}
              />
            ) : null}
          </Flex>
        )
      })}
    </Flex>
  )
}
