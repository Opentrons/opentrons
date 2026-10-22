import { useTranslation } from 'react-i18next'

import {
  Btn,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_START,
  StyledText,
} from '@opentrons/components'

import type { ReactNode } from 'react'
import type { SetSettingOption } from './types'

interface RobotNameProps {
  setCurrentOption: SetSettingOption
}

export function RobotName({ setCurrentOption }: RobotNameProps): ReactNode {
  const { t } = useTranslation(['device_settings'])
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_FLEX_START}>
        <Btn
          onClick={() => {
            setCurrentOption(null)
          }}
        >
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
      </Flex>
      <StyledText fontSize="2rem" textAlign="center">
        {t('robot_name')}
      </StyledText>
    </Flex>
  )
}
