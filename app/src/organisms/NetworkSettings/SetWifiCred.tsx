import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  LEGACY_COLORS,
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

import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { NormalKeyboard } from '../../atoms/SoftwareKeyboard'
import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'

const SSID_INPUT_FIELD_STYLE = css`
  padding-top: 2.125rem;
  padding-bottom: 2.125rem;
  height: 4.25rem;
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  color: ${LEGACY_COLORS.darkBlack100};
  padding-left: ${SPACING.spacing24};
  box-sizing: border-box;
  width: 42.625rem;

  &:focus {
    border: 3px solid ${LEGACY_COLORS.blueEnabled};
    filter: drop-shadow(0px 0px 10px ${LEGACY_COLORS.blueEnabled});
    border-radius: ${BORDERS.borderRadiusSize1};
  }
`

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
