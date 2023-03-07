import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  Btn,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_START,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

const TOUCH_STYLE = css`
  /* smartphones, touchscreens */
  @media (hover: none) and (pointer: coarse) {
    background-color: #ff0000;
  }
  /* stylus-based screens */
  @media (hover: none) and (pointer: fine) {
    background-color: #ff00ff;
  }
  /* Nintendo Wii controller, Microsoft Kinect */
  @media (hover: hover) and (pointer: coarse) {
    background-color: #ffff00;
  }
  /* mouse, touch pad */
  @media (hover: hover) and (pointer: fine) {
    background-color: #00ffff; // on-device mode
  }
`

interface DisplayBrightnessProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function DisplayBrightness({
  setCurrentOption,
}: DisplayBrightnessProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  return (
    <Flex flexDirection={DIRECTION_COLUMN} css={TOUCH_STYLE}>
      <Flex justifyContent={JUSTIFY_FLEX_START}>
        <Btn onClick={() => setCurrentOption(null)}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
      </Flex>
      <StyledText fontSize="2rem" textAlign="center">
        {t('display_brightness')}
      </StyledText>
    </Flex>
  )
}
