import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  SPACING,
  Icon,
  Btn,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { InputField } from '../../../atoms/InputField'
import { NormalKeyboard } from '../../../atoms/SoftwareKeyboard'
import { TertiaryButton } from '../../../atoms/buttons'

const SSID_INPUT_FIELD_STYLE = css`
  padding-top: ${SPACING.spacing5};
  padding-bottom: ${SPACING.spacing5};
  font-size: 2.5rem;
  line-height: 3.25rem;
  text-align: center;
`

interface SetWifiCredProps {
  ssid: string
  authType: 'wpa-psk' | 'none'
  setShowSelectAuthenticationType: (isShow: boolean) => void
  password: string
  setPassword: (password: string) => void
  handleConnect: () => void
}

export function SetWifiCred({
  ssid,
  authType,
  setShowSelectAuthenticationType,
  password,
  setPassword,
  handleConnect,
}: SetWifiCredProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const keyboardRef = React.useRef(null)
  const [showPassword, setShowPassword] = React.useState<boolean>(false)

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginBottom="3.0625rem"
      >
        <Btn onClick={() => setShowSelectAuthenticationType(true)}>
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon
              name="chevron-left"
              marginRight={SPACING.spacing2}
              size="1.875rem"
            />
            <StyledText
              fontSize="1.625rem"
              lineHeight="2.1875rem"
              fontWeight="700"
            >
              {t('shared:back')}
            </StyledText>
          </Flex>
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {`${ssid}`}
        </StyledText>
        <TertiaryButton
          width="8.9375rem"
          height="3.75rem"
          fontSize="1.5rem"
          fontWeight="500"
          lineHeight="2.0425rem"
          onClick={handleConnect}
        >
          {t('connect')}
        </TertiaryButton>
      </Flex>
      <Flex width="100%" flexDirection={DIRECTION_COLUMN} paddingLeft="6.25rem">
        <StyledText
          marginBottom="0.75rem"
          fontSize="1.375rem"
          lineHeight="1.875rem"
          fontWeight="500"
        >
          {'Enter password'}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW}>
          <Box width="36.375rem">
            <InputField
              aria-label="wifi_password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              css={SSID_INPUT_FIELD_STYLE}
            />
          </Box>
          <Btn
            marginLeft="1.5rem"
            onClick={() => setShowPassword(currentState => !currentState)}
          >
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <Icon
                name={showPassword ? 'eye-slash' : 'eye'}
                width="2.75rem"
                height="1.875rem"
              />
              <StyledText marginLeft={SPACING.spacing4}>
                {showPassword ? t('hide') : t('show')}
              </StyledText>
            </Flex>
          </Btn>
        </Flex>
      </Flex>
      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <NormalKeyboard
          onChange={e => e != null && setPassword(String(e))}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </>
  )
}
