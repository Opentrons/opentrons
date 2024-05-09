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
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  const handleBlur = (): void => {
    if (inputRef.current != null) inputRef.current?.focus()
  }

  React.useEffect(() => {
    if (inputRef.current != null || password.length > 0) {
      console.log('hello')
      console.log(inputRef?.current)
      inputRef?.current?.focus()
    }
  }, [password])

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
              type={showPassword ? 'text' : 'password'}
              onBlur={handleBlur}
              ref={inputRef}
              autoFocus
            />
          </Box>
          <Btn
            marginLeft={SPACING.spacing24}
            onClick={() => {
              setShowPassword(currentState => !currentState)
              const input = document.querySelector('input')
              console.log('onclick')
              console.log(input)
              inputRef?.current?.focus()
              input?.setSelectionRange(input.value.length, input.value.length)
            }}
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
          onChange={e => {
            e != null && setPassword(String(e))
            inputRef?.current?.focus()
          }}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </>
  )
}
