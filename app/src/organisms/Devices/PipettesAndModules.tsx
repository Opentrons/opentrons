import * as React from 'react'
import { useTranslation } from 'react-i18next'

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
} from '@opentrons/components'

import { ModuleCard } from './ModuleCard'
import { useAttachedModules, useIsRobotViewable } from './hooks'

interface PipettesAndModulesProps {
  robotName: string
}

export function PipettesAndModules({
  robotName,
}: PipettesAndModulesProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const attachedModules = useAttachedModules(robotName)
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
        data-testid="PipettesAndModules_title"
      >
        {t('pipettes_and_modules')}
      </Text>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        minHeight={SIZE_3}
        padding={SPACING_2}
        width="100%"
      >
        {isRobotViewable ? (
          <Flex flexWrap={WRAP} alignItems={ALIGN_CENTER} width="100%">
            {attachedModules.map((module, index) => {
              return (
                <Flex key={`moduleCard_${module.type}_${index}`}>
                  <ModuleCard module={module} />
                </Flex>
              )
            })}
          </Flex>
        ) : (
          <Text
            fontSize={FONT_SIZE_BODY_1}
            data-testid="PipettesAndModules_offline"
          >
            {t('offline_pipettes_and_modules')}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
