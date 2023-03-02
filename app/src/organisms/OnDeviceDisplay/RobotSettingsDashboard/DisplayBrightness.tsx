import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  Btn,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_START,
  ALIGN_CENTER,
  Icon,
  DIRECTION_ROW,
  Box,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../../redux/config'

import type { Dispatch } from '../../../redux/types'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

const RECT_STYLE = css`
  width: 5.875rem;
  height: 8.75rem;
  border-radius: 8px;
  background: #9c3ba4;
`

// Note The actual brightness is Bright 1 <---> 6 Dark which is opposite to the UI
// For UI Bright 6 <--> 1 Dark
// If the brightness 7 or more | 0, the display will be blackout
const LOWEST_BRIGHTNESS = 6
const HIGHEST_BRIGHTNESS = 1

interface DisplayBrightnessProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function DisplayBrightness({
  setCurrentOption,
}: DisplayBrightnessProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  const dispatch = useDispatch<Dispatch>()
  const initialBrightness = useSelector(getOnDeviceDisplaySettings).brightness
  const [brightness, setBrightness] = React.useState<number>(initialBrightness)

  const handleClick = (changeType: 'up' | 'down'): void => {
    const step = changeType === 'up' ? -1 : 1
    if (brightness >= 1 && brightness <= 6) {
      setBrightness(prevBrightness => prevBrightness + step)
    } else {
      setBrightness(brightness > 6 ? 6 : 1)
    }
    dispatch(
      updateConfigValue('onDeviceDisplaySettings.brightness', brightness)
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={ALIGN_CENTER}>
        <Btn onClick={() => setCurrentOption(null)}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" textAlign="center">
          {t('display_brightness')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        width="56.5rem"
        height="8.75rem"
        marginTop="7.625rem"
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Btn
          // disabled={brightness === LOWEST_BRIGHTNESS}
          onClick={() => handleClick('down')}
        >
          <Icon size="5rem" name="minus" />
        </Btn>
        <Flex flexDirection={DIRECTION_ROW} gridGap="0.4375rem">
          <Box css={RECT_STYLE}></Box>
          <Box css={RECT_STYLE}></Box>
          <Box css={RECT_STYLE}></Box>
          <Box css={RECT_STYLE}></Box>
          <Box css={RECT_STYLE}></Box>
          <Box css={RECT_STYLE}></Box>
          <Box css={RECT_STYLE}></Box>
        </Flex>

        <Btn
          // disabled={brightness === HIGHEST_BRIGHTNESS}
          onClick={() => handleClick('up')}
        >
          <Icon size="5rem" name="plus" />
        </Btn>
      </Flex>
      <StyledText fontSize="2rem">{`brightness ${brightness}`}</StyledText>
      <StyledText fontSize="2rem">{`initialBrightness ${initialBrightness}`}</StyledText>
    </Flex>
  )
}
