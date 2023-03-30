import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  Flex,
  Btn,
  DIRECTION_COLUMN,
  Icon,
  ALIGN_CENTER,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../../redux/config'
import { SLEEP_NEVER_MS } from '../../../App/constants'

import type { Dispatch } from '../../../redux/types'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

interface LabelProps {
  isSelected?: boolean
}

const SettingButton = styled.input`
  display: none;
`

const SettingButtonLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing5};
  border-radius: ${BORDERS.size_four};
  height: 5.25rem;
  cursor: pointer;
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blueEnabled : COLORS.foundationalBlue};
  color: ${({ isSelected }) => isSelected === true && COLORS.white};
`

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
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex alignItems={ALIGN_CENTER}>
        <Btn onClick={() => setCurrentOption(null)}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('touchscreen_sleep')}
        </StyledText>
      </Flex>
      <Flex marginTop={SPACING.spacingXXL}>
        <StyledText>{t('sleep_settings_description')}</StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        marginTop={SPACING.spacing5}
      >
        {settingsButtons.map(radio => (
          <React.Fragment key={`sleep_setting_${radio.label}`}>
            <SettingButton
              id={radio.label}
              type="radio"
              value={radio.value}
              checked={radio.value === sleepMs}
              onChange={handleChange}
            />
            <SettingButtonLabel
              htmlFor={radio.label}
              isSelected={radio.value === sleepMs}
            >
              <StyledText
                fontSize="1.75rem"
                lineHeight="1.875rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
              >
                {radio.label}
              </StyledText>
            </SettingButtonLabel>
          </React.Fragment>
        ))}
      </Flex>
    </Flex>
  )
}
