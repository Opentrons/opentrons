import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Text,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  SIZE_4,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import { useIsRobotViewable } from './hooks'

interface RecentProtocolRunsProps {
  robotName: string
}

export function RecentProtocolRuns({
  robotName,
}: RecentProtocolRunsProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const isRobotViewable = useIsRobotViewable(robotName)

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={C_WHITE}
      border={`1px solid ${C_MED_LIGHT_GRAY}`}
      borderRadius="3px"
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_BODY_2}
        borderBottom={`1px solid ${C_MED_LIGHT_GRAY}`}
        padding={SPACING_3}
        width="100%"
        id="RecentProtocolRuns_title"
      >
        {t('recent_protocol_runs')}
      </Text>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        minHeight={SIZE_4}
        padding={SPACING_2}
        width="100%"
      >
        {isRobotViewable ? (
          // TODO: recent protocol runs section (ticket #8696)
          <div>recent protocol runs here</div>
        ) : (
          <Text fontSize={FONT_SIZE_BODY_1} id="RecentProtocolRuns_offline">
            {t('offline_recent_protocol_runs')}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
