import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { RadioButton } from '../../../atoms/buttons'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../../redux/config'
import { SLEEP_NEVER_MS } from '../../../App/constants'

import type { Dispatch } from '../../../redux/types'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard/RobotSettingButton'

const SLEEP_TIME_MS = 60 * 1000 // 1 min

interface TouchScreenSleepProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function TouchScreenSleep({
  setCurrentOption,
}: TouchScreenSleepProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  // ToDo (kj:02/06/2023) This will be replaced config value via redux
  const { sleepMs } = useSelector(getOnDeviceDisplaySettings) ?? SLEEP_NEVER_MS
  const dispatch = useDispatch<Dispatch>()

  // Note (kj:02/10/2023) value's unit is ms
  const settingsButtons = [
    { label: t('never'), value: SLEEP_NEVER_MS },
    { label: t('minutes', { minute: 3 }), value: SLEEP_TIME_MS * 3 },
    { label: t('minutes', { minute: 5 }), value: SLEEP_TIME_MS * 5 },
    { label: t('minutes', { minute: 10 }), value: SLEEP_TIME_MS * 10 },
    { label: t('minutes', { minute: 15 }), value: SLEEP_TIME_MS * 15 },
    { label: t('minutes', { minute: 30 }), value: SLEEP_TIME_MS * 30 },
    { label: t('one_hour'), value: SLEEP_TIME_MS * 60 },
  ]

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(
      updateConfigValue(
        'onDeviceDisplaySettings.sleepMs',
        Number(event.target.value)
      )
    )
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing32}
      gridGap={SPACING.spacing32}
    >
      <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_ROW}>
        <Btn onClick={() => setCurrentOption(null)}>
          <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('touchscreen_sleep')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        // marginTop={SPACING.spacing24}
      >
        {settingsButtons.map(radio => (
          <RadioButton
            key={`sleep_setting_${radio.label}`}
            buttonLabel={radio.label}
            buttonValue={radio.value}
            onChange={handleChange}
            isSelected={radio.value === sleepMs}
          />
        ))}
      </Flex>
    </Flex>
  )
}
