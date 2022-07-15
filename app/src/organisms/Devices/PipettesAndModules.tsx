import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getPipetteModelSpecs, LEFT, RIGHT } from '@opentrons/shared-data'
import { useModulesQuery, usePipettesQuery } from '@opentrons/react-api-client'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ModuleCard } from '../ModuleCard'
import { useIsRobotViewable, useRunStatuses } from './hooks'
import { PipetteCard } from './PipetteCard'

const EQUIPMENT_POLL_MS = 5000
interface PipettesAndModulesProps {
  robotName: string
}

export function PipettesAndModules({
  robotName,
}: PipettesAndModulesProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const attachedPipettes = usePipettesQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })?.data ?? { left: undefined, right: undefined }
  const isRobotViewable = useIsRobotViewable(robotName)
  const currentRunId = useCurrentRunId()
  const { isRunTerminal } = useRunStatuses()

  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
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
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginBottom={SPACING.spacing4}
        id="PipettesAndModules_title"
      >
        {t('pipettes_and_modules')}
      </StyledText>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        minHeight={SIZE_3}
        paddingBottom={SPACING.spacing3}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
      >
        {currentRunId != null && !isRunTerminal && (
          <Flex
            paddingBottom={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
            paddingX={SPACING.spacing2}
            width="100%"
          >
            <Banner type="warning">{t('robot_control_not_available')}</Banner>
          </Flex>
        )}
        {isRobotViewable ? (
          <Box width="100%">
            <Flex gridGap={SPACING.spacing3}>
              <PipetteCard
                pipetteId={attachedPipettes.left?.id}
                pipetteInfo={
                  attachedPipettes.left?.model != null
                    ? getPipetteModelSpecs(attachedPipettes.left?.model) ?? null
                    : null
                }
                mount={LEFT}
                robotName={robotName}
              />
              <PipetteCard
                pipetteId={attachedPipettes.right?.id}
                pipetteInfo={
                  attachedPipettes.right?.model != null
                    ? getPipetteModelSpecs(attachedPipettes.right?.model) ??
                      null
                    : null
                }
                mount={RIGHT}
                robotName={robotName}
              />
            </Flex>
            <Flex gridGap={SPACING.spacing3}>
              <Box flex="50%">
                {leftColumnModules.map((module, index) => (
                  <ModuleCard
                    key={`moduleCard_${module.moduleType}_${index}`}
                    robotName={robotName}
                    module={module}
                    isLoadedInRun={false}
                  />
                ))}
              </Box>
              <Box flex="50%">
                {rightColumnModules.map((module, index) => (
                  <ModuleCard
                    key={`moduleCard_${module.moduleType}_${index}`}
                    robotName={robotName}
                    module={module}
                    isLoadedInRun={false}
                  />
                ))}
              </Box>
            </Flex>
          </Box>
        ) : (
          <StyledText as="p" id="PipettesAndModules_offline">
            {t('offline_pipettes_and_modules')}
          </StyledText>
        )}
      </Flex>
    </Flex>
  )
}
