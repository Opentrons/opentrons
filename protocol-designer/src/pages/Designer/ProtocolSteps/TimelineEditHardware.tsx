import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { FlexHardware } from '../../../components/organisms'
import { Ot2Modules } from '../../../components/organisms/Ot2Modules'
import { getRobotType } from '../../../file-data/selectors'

import type { ReactNode } from 'react'

export function TimelineEditHardware(): ReactNode {
  const { t } = useTranslation('protocol_steps')
  const robotType = useSelector(getRobotType)
  return (
    <Flex
      borderRadius={BORDERS.borderRadius12}
      backgroundColor={COLORS.white}
      padding={SPACING.spacing60}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing24}
    >
      <StyledText desktopStyle="headingSmallRegular" color={COLORS.grey60}>
        {robotType === FLEX_ROBOT_TYPE
          ? t('edit_hardware_on_deck')
          : t('place_modules')}
      </StyledText>
      {robotType === FLEX_ROBOT_TYPE ? <FlexHardware /> : <Ot2Modules />}
    </Flex>
  )
}
