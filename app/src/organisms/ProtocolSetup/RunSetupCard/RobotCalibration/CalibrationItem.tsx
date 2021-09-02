import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Text,
  Flex,
  Icon,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_STYLE_ITALIC,
  C_NEAR_WHITE,
  C_WHITE,
  COLOR_SUCCESS,
  Box,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { formatLastModified } from '../../../CalibrationPanels/utils'

interface Props {
  button?: JSX.Element
  calibrated: boolean
  calibratedDate?: string | null
  index?: number
  subText?: string
  title?: string
}

export function CalibrationItem(props: Props): JSX.Element | null {
  const { index, title, subText, calibratedDate, calibrated, button } = props
  const { t } = useTranslation(['protocol_setup'])
  const backgroundColor =
    index !== undefined && index % 2 === 0 ? C_NEAR_WHITE : C_WHITE
  const calibratedText =
    calibratedDate !== null && calibratedDate !== undefined
      ? t('last_calibrated', {
          date: formatLastModified(calibratedDate),
        })
      : t('not_calibrated')
  return (
    <Box backgroundColor={backgroundColor}>
      <Flex
        flexDirection="row"
        alignItems="center"
        padding=".5rem"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection="row" alignItems="center">
          {calibrated ? (
            <Icon
              name={'check-circle'}
              height="1.5rem"
              width="1.5rem"
              color={COLOR_SUCCESS}
              marginRight="0.75rem"
            />
          ) : (
            <Icon
              height="1.5rem"
              width="1.5rem"
              name={'circle'}
              color={C_WHITE}
              border="1px solid #9B9B9B"
              borderRadius="1.5rem"
              marginRight="0.75rem"
            />
          )}
          <span>
            {title !== undefined && (
              <Text fontSize={FONT_SIZE_BODY_2}>{title}</Text>
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
