import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_START,
  SPACING,
  WRAP,
} from '@opentrons/components'
import * as React from 'react'
import { useModuleRenderInfoForProtocolById } from '../hooks'
import { ModuleCard } from '../ModuleCard'

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
