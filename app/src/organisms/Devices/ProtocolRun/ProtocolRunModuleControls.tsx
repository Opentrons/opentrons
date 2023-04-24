import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  SPACING,
  JUSTIFY_CENTER,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { ModuleCard } from '../../ModuleCard'
import { useModuleRenderInfoForProtocolById } from '../hooks'

interface ProtocolRunModuleControlsProps {
  robotName: string
  runId: string
}

export const ProtocolRunModuleControls = ({
  robotName,
  runId,
}: ProtocolRunModuleControlsProps): JSX.Element => {
  const { t } = useTranslation('protocol_details')
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const attachedModules = Object.values(moduleRenderInfoForProtocolById).filter(
    module => module.attachedModuleMatch != null
  )

  // split modules in half and map into each column separately to avoid
  // the need for hardcoded heights without limitation, array will be split equally
  // or left column will contain 1 more item than right column
  const halfAttachedModulesSize = Math.ceil(attachedModules?.length / 2)
  const leftColumnModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const rightColumnModules = attachedModules?.slice(halfAttachedModulesSize)

  return attachedModules.length === 0 ? (
    <Flex justifyContent={JUSTIFY_CENTER}>
      <StyledText
        as="p"
        color={COLORS.darkGreyEnabled}
        marginY={SPACING.spacing4}
      >
        {t('connect_modules_to_see_controls')}
      </StyledText>
    </Flex>
  ) : (
    <Flex
      gridGap={SPACING.spacing3}
      paddingTop={SPACING.spacing4}
      paddingBottom={SPACING.spacing3}
      paddingX={SPACING.spacing4}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex="50%"
        gridGap={SPACING.spacing3}
      >
        {leftColumnModules.map((module, index) =>
          module.attachedModuleMatch != null ? (
            <ModuleCard
              key={`moduleCard_${String(module.moduleDef.moduleType)}_${index}`}
              robotName={robotName}
              runId={runId}
              module={module.attachedModuleMatch}
              slotName={module.slotName}
              isLoadedInRun={true}
            />
          ) : null
        )}
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex="50%"
        gridGap={SPACING.spacing3}
      >
        {rightColumnModules.map((module, index) =>
          module.attachedModuleMatch != null ? (
            <ModuleCard
              key={`moduleCard_${String(module.moduleDef.moduleType)}_${index}`}
              robotName={robotName}
              runId={runId}
              module={module.attachedModuleMatch}
              slotName={module.slotName}
              isLoadedInRun={true}
            />
          ) : null
        )}
      </Flex>
    </Flex>
  )
}
