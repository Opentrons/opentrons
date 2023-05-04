import { ODD_FOCUS_VISIBLE } from '../../../atoms/buttons/OnDeviceDisplay/constants'
import { StyledText } from '../../../atoms/text'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../../redux/config'
import type { Dispatch } from '../../../redux/types'
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
  BORDERS,
  SPACING,
  COLORS,
} from '@opentrons/components'
import clamp from 'lodash/clamp'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled, { css } from 'styled-components'

const BUTTON_STYLE = css`
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
  }

  &:active {
    color: ${COLORS.darkBlack_forty};
  }
`

interface BrightnessTileProps {
  isActive: boolean
}

const BrightnessTile = styled(Box)`
  width: 100%;
  height: 8.75rem;
  border-radius: ${BORDERS.size_two};
  background: ${(props: BrightnessTileProps) =>
    props.isActive ? COLORS.blueEnabled : COLORS.mediumBlueEnabled};
`

// Note The actual brightness is Bright 1 <---> 6 Dark which is opposite to the UI
// For UI Bright 6 <--> 1 Dark
// If the brightness 7 or more | 0, the display will be blackout
const LOWEST_BRIGHTNESS = 6
const HIGHEST_BRIGHTNESS = 1

interface TouchscreenBrightnessProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function TouchscreenBrightness({
  setCurrentOption,
}: TouchscreenBrightnessProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  const dispatch = useDispatch<Dispatch>()
  const initialBrightness = useSelector(getOnDeviceDisplaySettings).brightness
  const [brightness, setBrightness] = React.useState<number>(initialBrightness)
  const brightnessLevel = [6, 5, 4, 3, 2, 1]

  const handleClick = (changeType: 'up' | 'down'): void => {
    const step = changeType === 'up' ? -1 : 1
    const nextBrightness = clamp(
      brightness + step,
      HIGHEST_BRIGHTNESS,
      LOWEST_BRIGHTNESS
    )
    dispatch(
      updateConfigValue('onDeviceDisplaySettings.brightness', nextBrightness)
    )
    setBrightness(nextBrightness)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={ALIGN_CENTER}>
        <Btn
          onClick={() => setCurrentOption(null)}
          data-testid="TouchscreenBrightness_back_button"
        >
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" textAlign="center">
          {t('touchscreen_brightness')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        width="56.5rem"
        height="8.75rem"
        marginTop="7.625rem"
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing24}
      >
        <Btn
          disabled={brightness === LOWEST_BRIGHTNESS}
          onClick={() => handleClick('down')}
          data-testid="TouchscreenBrightness_decrease"
          css={BUTTON_STYLE}
        >
          <Icon size="5rem" name="minus" />
        </Btn>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          width="43.5rem"
        >
          {brightnessLevel.map(level => (
            <BrightnessTile
              key={`brightness_level_${level}`}
              isActive={brightness <= level}
            />
          ))}
        </Flex>

        <Btn
          disabled={brightness === HIGHEST_BRIGHTNESS}
          onClick={() => handleClick('up')}
          data-testid="TouchscreenBrightness_increase"
          css={BUTTON_STYLE}
        >
          <Icon size="5rem" name="plus" />
        </Btn>
      </Flex>
    </Flex>
  )
}
