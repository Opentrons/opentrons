import { useRef, useState, memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  InputField,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  POSITION_FIXED,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
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
  const MemoizedInput = memo(InputField)
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
          <LegacyStyledText as="p">{t('enter_password')}</LegacyStyledText>
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
            <Btn
              onClick={() => {
                setShowPassword(currentState => !currentState)
                inputRef?.current?.focus()
              }}
              display={DISPLAY_FLEX}
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing12}
              width="7.375rem"
            >
              <Icon
                name={showPassword ? 'eye-slash' : 'eye'}
                size="3rem"
                data-testid={showPassword ? 'icon_eye-slash' : 'icon_eye'}
              />
              <LegacyStyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {showPassword ? t('hide') : t('show')}
              </LegacyStyledText>
            </Btn>
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
