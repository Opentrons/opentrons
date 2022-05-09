import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import {
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING,
  WRAP,
  JUSTIFY_START,
  DIRECTION_ROW,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ModuleCard } from './ModuleCard'
import {
  useAttachedModules,
  useAttachedPipettes,
  useIsRobotViewable,
} from './hooks'
import { PipetteCard } from './PipetteCard'

interface PipettesAndModulesProps {
  robotName: string
}

export function PipettesAndModules({
  robotName,
}: PipettesAndModulesProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const attachedModules = useAttachedModules(robotName)
  const attachedPipettes = useAttachedPipettes(robotName)
  const isRobotViewable = useIsRobotViewable(robotName)
  const currentRunId = useCurrentRunId()

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
        paddingX={SPACING.spacing3}
        paddingBottom={SPACING.spacing3}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
      >
        {currentRunId != null && (
          <Flex
            paddingBottom={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
            paddingX={SPACING.spacing2}
            width="100%"
          >
            <Banner type="warning">{t('robot_control_not_available')}</Banner>
          </Flex>
        )}
        {/* TODO(jr, 4/15/22): This needs to be refactored to get a combined array of pipettes and modules so it can display with widths matching each column as the design shows */}
        {isRobotViewable ? (
          <Flex flexDirection={DIRECTION_COLUMN} width="100%">
            <Flex flexDirection={DIRECTION_ROW}>
              <PipetteCard
                pipetteId={attachedPipettes.left?.id}
                pipetteInfo={attachedPipettes.left?.modelSpecs ?? null}
                mount={LEFT}
                robotName={robotName}
              />
              <PipetteCard
                pipetteId={attachedPipettes.right?.id}
                pipetteInfo={attachedPipettes.right?.modelSpecs ?? null}
                mount={RIGHT}
                robotName={robotName}
              />
            </Flex>
            <Flex
              justifyContent={JUSTIFY_START}
              flexDirection={DIRECTION_COLUMN}
              flexWrap={WRAP}
              maxHeight="25rem"
            >
              {attachedModules.map((module, index) => {
                return (
                  <Flex
                    flex="1"
                    maxWidth="50%"
                    key={`moduleCard_${module.moduleType}_${index}`}
                  >
                    <ModuleCard module={module} robotName={robotName} />
                  </Flex>
                )
              })}
            </Flex>
          </Flex>
        ) : (
          <StyledText as="p" id="PipettesAndModules_offline">
            {t('offline_pipettes_and_modules')}
          </StyledText>
        )}
      </Flex>
    </Flex>
  )
}
