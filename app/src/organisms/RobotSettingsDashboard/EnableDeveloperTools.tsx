import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Btn,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_START,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

import type { SettingOption } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard/RobotSettingButton'

interface EnableDeveloperToolsProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function EnableDeveloperTools({
  setCurrentOption,
}: EnableDeveloperToolsProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_FLEX_START}>
        <Btn onClick={() => setCurrentOption(null)}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
      </Flex>
      <StyledText fontSize="2rem" textAlign="center">
        {t('enable_developer_tools')}
      </StyledText>
    </Flex>
  )
}
