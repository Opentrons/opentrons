import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { InputField } from '../../../atoms/InputField'
import { NormalKeyboard } from '../../../atoms/SoftwareKeyboard'
import { SmallButton } from '../../../atoms/buttons'

const SSID_INPUT_FIELD_STYLE = css`
  padding-top: 2.125rem;
  padding-bottom: 2.125rem;
  height: 4.25rem;
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  color: ${COLORS.darkBlack100};
  padding-left: ${SPACING.spacing24};
  box-sizing: border-box;

  &:focus {
    border: 3px solid ${COLORS.blueEnabled};
    filter: drop-shadow(0px 0px 10px ${COLORS.blueEnabled});
    border-radius: ${BORDERS.size1};
  }
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
        marginBottom={SPACING.spacing48}
      >
        <Btn
          onClick={() => setShowSelectAuthenticationType(true)}
          data-testid="SetWifiCred_back_button"
        >
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon name="back" marginRight={SPACING.spacing4} size="3rem" />
          </Flex>
        </Btn>
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('sign_into_wifi')}
        </StyledText>
        <SmallButton
          buttonType="primary"
          buttonCategory="rounded"
          buttonText={t('connect')}
          onClick={handleConnect}
        />
      </Flex>
      <Flex width="100%" flexDirection={DIRECTION_COLUMN} paddingLeft="6.25rem">
        <StyledText as="p" marginBottom={SPACING.spacing12}>
          {t('enter_password')}
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
        <NormalKeyboard
          onChange={e => e != null && setPassword(String(e))}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </>
  )
}
