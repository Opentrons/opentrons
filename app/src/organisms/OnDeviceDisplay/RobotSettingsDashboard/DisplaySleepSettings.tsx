import * as React from 'react'
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
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

interface LabelProps {
  isSelected?: boolean
}

const SettingButton = styled.input`
  display: none;
`

const SettingButtonLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing5};
  border-radius: 16px;
  cursor: pointer;
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blueEnabled : '#e0e0e0'};
  color: ${({ isSelected }) => isSelected === true && COLORS.white};
`

interface DisplaySleepSettingsProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function DisplaySleepSettings({
  setCurrentOption,
}: DisplaySleepSettingsProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  // ToDo (kj:02/06/2023) This will be replaced config value via redux
  const [selected, setSelected] = React.useState<number>(0)
  const settingsButtons = [
    { label: t('never'), value: 0 },
    { label: t('minutes', { minute: 3 }), value: 3 },
    { label: t('minutes', { minute: 15 }), value: 15 },
    { label: t('minutes', { minute: 30 }), value: 30 },
    { label: t('one_hour'), value: 60 },
  ]

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    console.log('selected')
    setSelected(Number(event.target.value))
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex alignItems={ALIGN_CENTER}>
        <Btn onClick={() => setCurrentOption(null)}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('sleep_settings')}
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
              checked={radio.value === selected}
              onChange={handleChange}
            />
            <SettingButtonLabel
              htmlFor={radio.label}
              isSelected={radio.value === selected}
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
