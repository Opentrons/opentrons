import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  POSITION_FIXED,
  SPACING,
  TouchInputField,
} from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'

interface SetWifiCredProps {
  password: string
  setPassword: (password: string) => void
}

export function SetWifiCred({
  password,
  setPassword,
}: SetWifiCredProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const keyboardRef = useRef(null)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()
  const MemoizedInput = memo(TouchInputField)
  const handleBlur = (): void => {
    if (inputRef.current != null) inputRef.current?.focus()
  }

  useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.focus()
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
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <LegacyStyledText forwardedAs="p">
            {t('enter_password')}
          </LegacyStyledText>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing24}
          >
            <Box width="42.625rem">
              <MemoizedInput
                aria-label="wifi_password"
                id="wifiPassword"
                value={password}
                type={showPassword ? 'text' : 'password'}
                onBlur={handleBlur}
                ref={inputRef}
                autoFocus
              />
            </Box>
            <PasswordVisibilityToggle
              isVisible={showPassword}
              onToggle={() => {
                setShowPassword(currentState => !currentState)
                inputRef?.current?.focus()
              }}
            />
          </Flex>
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
