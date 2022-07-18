import * as React from 'react'
import { Box, Flex, SPACING } from '@opentrons/components'
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

  // split modules in half and map into each column separately to avoid
  // the need for hardcoded heights without limitation, array will be split equally
  // or left column will contain 1 more item than right column
  const halfAttachedModulesSize = Math.ceil(attachedModules?.length / 2)
  const leftColumnModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const rightColumnModules =
    attachedModules?.length > 1
      ? attachedModules?.slice(-halfAttachedModulesSize)
      : []

  return (
    <Flex
      gridGap={SPACING.spacing3}
      paddingTop={SPACING.spacing4}
      paddingBottom={SPACING.spacing3}
      paddingX={SPACING.spacing4}
    >
      <Box flex="50%">
        {leftColumnModules.map((module, index) =>
          module.attachedModuleMatch != null ? (
            <ModuleCard
              key={`moduleCard_${module.moduleDef.moduleType}_${index}`}
              robotName={robotName}
              runId={runId}
              module={module.attachedModuleMatch}
              slotName={module.slotName}
              isLoadedInRun={true}
            />
          ) : null
        )}
      </Box>
      <Box flex="50%">
        {rightColumnModules.map((module, index) =>
          module.attachedModuleMatch != null ? (
            <ModuleCard
              key={`moduleCard_${module.moduleDef.moduleType}_${index}`}
              robotName={robotName}
              runId={runId}
              module={module.attachedModuleMatch}
              slotName={module.slotName}
              isLoadedInRun={true}
            />
          ) : null
        )}
      </Box>
    </Flex>
  )
}
