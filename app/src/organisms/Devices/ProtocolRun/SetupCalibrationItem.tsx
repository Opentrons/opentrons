import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
  SIZE_1,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { formatTimestamp } from '../utils'

interface SetupCalibrationItemProps {
  calibratedDate: string | null
  label?: string
  title?: string
  subText?: string
  button?: JSX.Element
  id?: string
}

export function SetupCalibrationItem({
  label,
  title,
  subText,
  calibratedDate,
  button,
  id,
}: SetupCalibrationItemProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')

  const calibratedText =
    calibratedDate != null
      ? t('last_calibrated', {
          date: formatTimestamp(calibratedDate),
        })
      : t('not_calibrated')

  return (
    <Flex
      backgroundColor={COLORS.lightGrey}
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      minHeight="2.5rem" // 40px
      padding={`${SPACING.spacing3} ${SPACING.spacing4}`}
    >
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon
            size={SIZE_1}
            color={calibratedDate != null ? COLORS.success : COLORS.warning}
            marginRight={SPACING.spacing4}
            name={calibratedDate != null ? 'check-circle' : 'alert-circle'}
          />
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
            {label != null && (
              <StyledText
                color={COLORS.darkGreyEnabled}
                css={TYPOGRAPHY.h6SemiBold}
                textTransform={TEXT_TRANSFORM_UPPERCASE}
                id={id}
              >
                {label}
              </StyledText>
            )}
            {title != null && (
              <StyledText as="p" color={COLORS.darkBlack} id={id}>
                {title}
              </StyledText>
            )}
            <StyledText as="label" color={COLORS.darkGreyEnabled}>
              {subText ?? calibratedText}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
      {button}
    </Flex>
  )
}
