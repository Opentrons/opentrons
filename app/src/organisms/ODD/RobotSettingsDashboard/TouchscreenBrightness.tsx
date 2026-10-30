import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import clamp from 'lodash/clamp'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'

import { IconButton } from '/app/atoms/buttons/IconButton'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '/app/redux/config'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'
import type { SetSettingOption } from './types'

const BRIGHTNESS_LEVELS = [1, 2, 3, 4, 5, 6] as const

interface BrightnessTileProps {
  $isActive: boolean // transient props to avoid warning
}

const BrightnessTile = styled(Box)<BrightnessTileProps>`
  width: 100%;
  height: 8.75rem;
  border-radius: ${BORDERS.borderRadius8};
  background: ${({ $isActive }) =>
    $isActive === true ? COLORS.blue50 : COLORS.blue35};
`

// For UI Bright 6 <--> 1 Dark
// If the brightness 7 or more | 0, the display will be blackout
const LOWEST_BRIGHTNESS = 1
const HIGHEST_BRIGHTNESS = 6

interface TouchscreenBrightnessProps {
  setCurrentOption: SetSettingOption
}

export function TouchscreenBrightness({
  setCurrentOption,
}: TouchscreenBrightnessProps): ReactNode {
  const { t } = useTranslation(['device_settings'])
  const dispatch = useDispatch<Dispatch>()
  const initialBrightnessRawValue = useSelector(
    getOnDeviceDisplaySettings
  ).brightness
  const initialBrightness = clamp(
    initialBrightnessRawValue,
    LOWEST_BRIGHTNESS,
    HIGHEST_BRIGHTNESS
  )
  const [brightness, setBrightness] = useState<number>(initialBrightness)

  const handleClick = (changeType: 'up' | 'down'): void => {
    const step = changeType === 'up' ? 1 : -1
    const nextBrightness = clamp(
      brightness + step,
      LOWEST_BRIGHTNESS,
      HIGHEST_BRIGHTNESS
    )
    dispatch(
      updateConfigValue('onDeviceDisplaySettings.brightness', nextBrightness)
    )
    setBrightness(nextBrightness)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('touchscreen_brightness')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing24}
        paddingX={SPACING.spacing60}
        paddingY={SPACING.spacing120}
        marginTop="7.75rem"
      >
        <IconButton
          disabled={brightness === LOWEST_BRIGHTNESS}
          onClick={() => {
            handleClick('down')
          }}
          data-testid="TouchscreenBrightness_decrease"
          iconName="minus"
        />
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          width="43.5rem"
        >
          {BRIGHTNESS_LEVELS.map(level => (
            <BrightnessTile
              key={`brightness_level_${level}`}
              $isActive={brightness >= level}
            />
          ))}
        </Flex>

        <IconButton
          disabled={brightness === HIGHEST_BRIGHTNESS}
          onClick={() => {
            handleClick('up')
          }}
          data-testid="TouchscreenBrightness_increase"
          iconName="plus"
        />
      </Flex>
    </Flex>
  )
}
