import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { InputField } from '../../atoms/InputField'
import { FullKeyboard } from '../../atoms/SoftwareKeyboard'
import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'

interface SetWifiCredProps {
  password: string
  setPassword: (password: string) => void
}

export function SetWifiCred({
  password,
  setPassword,
}: SetWifiCredProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const keyboardRef = React.useRef(null)
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  return (
    <>
      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        padding={`0 6.25rem ${SPACING.spacing40}`}
        marginTop={isUnboxingFlowOngoing ? undefined : '7.75rem'}
      >
        <StyledText as="p" marginBottom={SPACING.spacing12}>
          {t('enter_password')}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Box width="100%">
            <InputField
              aria-label="wifi_password"
              id="wifiPassword"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              onBlur={e => e.target.focus()}
              autoFocus
            />
          </Box>
          <Btn
            marginLeft={SPACING.spacing24}
            onClick={() => setShowPassword(currentState => !currentState)}
          >
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing16}
            >
              <Icon name={showPassword ? 'eye-slash' : 'eye'} size="3rem" />
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {showPassword ? t('hide') : t('show')}
              </StyledText>
            </Flex>
          </Btn>
        </Flex>
      </Flex>
      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <FullKeyboard
          onChange={e => e != null && setPassword(String(e))}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </>
  )
}
