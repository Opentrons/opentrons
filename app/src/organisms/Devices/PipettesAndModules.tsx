import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import {
  Flex,
  Text,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING_2,
  SPACING_3,
  WRAP,
  JUSTIFY_START,
  DIRECTION_ROW,
} from '@opentrons/components'

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

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_BODY_2}
        marginBottom={SPACING_3}
        id="PipettesAndModules_title"
      >
        {t('pipettes_and_modules')}
      </Text>
      <Flex
        alignItems={ALIGN_CENTER}
        minHeight={SIZE_3}
        padding={SPACING_2}
        width="100%"
      >
        {/* TODO(jr, 4/15/22): This needs to be refactored to get a combined array of pipettes and modules so it can display with widths matching each column as the design shows */}
        {isRobotViewable ? (
          <Flex flexDirection={DIRECTION_COLUMN} width="100%">
            <Flex flexDirection={DIRECTION_ROW}>
              <PipetteCard
                pipetteInfo={attachedPipettes.left?.modelSpecs ?? null}
                mount={LEFT}
                robotName={robotName}
              />
              <PipetteCard
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
                    key={`moduleCard_${module.type}_${index}`}
                  >
                    <ModuleCard module={module} robotName={robotName} />
                  </Flex>
                )
              })}
            </Flex>
          </Flex>
        ) : (
          <Text
            justifyContent={JUSTIFY_CENTER}
            fontSize={FONT_SIZE_BODY_1}
            id="PipettesAndModules_offline"
          >
            {t('offline_pipettes_and_modules')}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
