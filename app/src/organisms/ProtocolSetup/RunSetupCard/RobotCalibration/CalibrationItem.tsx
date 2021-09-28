import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Text,
  Flex,
  Icon,
  SIZE_2,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_STYLE_ITALIC,
  C_NEAR_WHITE,
  C_WHITE,
  COLOR_WARNING,
  COLOR_SUCCESS,
  SPACING_2,
  ALIGN_CENTER,
  DIRECTION_ROW,
  BORDER_SOLID_MEDIUM,
  Box,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { formatLastModified } from '../../../CalibrationPanels/utils'

interface Props {
  button?: JSX.Element
  calibratedDate?: string | null
  index?: number
  subText?: string
  title?: string
}

export function CalibrationItem(props: Props): JSX.Element | null {
  const { index, title, subText, calibratedDate, button } = props
  const { t } = useTranslation('protocol_setup')
  const backgroundColor =
    index !== undefined && index % 2 === 0 ? C_NEAR_WHITE : C_WHITE
  const calibratedText =
    calibratedDate != null
      ? t('last_calibrated', {
          date: formatLastModified(calibratedDate),
        })
      : t('not_calibrated')
  return (
    <Box backgroundColor={backgroundColor}>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        padding={SPACING_2}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon
            size={'1.5rem'}
            color={calibratedDate != null ? COLOR_SUCCESS : COLOR_WARNING}
            marginRight={SPACING_2}
            name={calibratedDate != null ? 'check-circle' : 'alert-circle'}
          />
          <span>
            {title !== undefined && (
              <Text role={'heading'} fontSize={FONT_SIZE_BODY_2}>
                {title}
              </Text>
            )}
            <Text fontSize={FONT_SIZE_BODY_1} fontStyle={FONT_STYLE_ITALIC}>
              {subText !== undefined ? subText : calibratedText}
            </Text>
          </span>
        </Flex>
        <div>{button}</div>
      </Flex>
    </Box>
  )
}
