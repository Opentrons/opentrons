import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  POSITION_FIXED,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { SmallButton } from '../../atoms/buttons'
import { NormalKeyboard } from '../../atoms/SoftwareKeyboard'
import { JOIN_OTHER } from '../Devices/RobotSettings/ConnectNetwork/constants'

import type { NetworkChangeState } from '../Devices/RobotSettings/ConnectNetwork/types'

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
    border-radius: ${BORDERS.borderRadiusSize1};
  }
`

interface SetWifiSsidProps {
  setSelectedSsid: (ssid: string) => void
  setShowSelectAuthenticationType: (
    showSelectAuthenticationType: boolean
  ) => void
  setChangeState: (changeState: NetworkChangeState) => void
}

export function SetWifiSsid({
  setSelectedSsid,
  setShowSelectAuthenticationType,
  setChangeState,
}: SetWifiSsidProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const [inputSsid, setInputSsid] = React.useState<string>('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const keyboardRef = React.useRef(null)

  const handleContinue = (): void => {
    if (inputSsid.length >= 2 && inputSsid.length <= 32) {
      setSelectedSsid(inputSsid)
      setShowSelectAuthenticationType(true)
      setChangeState({ type: JOIN_OTHER, ssid: inputSsid })
    } else {
      setErrorMessage(t('join_other_network_error_message'))
    }
  }

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginBottom="3.0625rem"
        flex="1"
      >
        <Flex justifyContent={JUSTIFY_START} flex="1">
          <Btn
            onClick={() => setChangeState({ type: null })}
            data-testid="SetWifiSsid_back_button"
          >
            <Flex flexDirection={DIRECTION_ROW}>
              <Icon name="back" marginRight={SPACING.spacing2} size="3rem" />
            </Flex>
          </Btn>
        </Flex>
        <Flex justifyContent={JUSTIFY_CENTER} flex="2">
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('join_other_network')}
          </StyledText>
        </Flex>
        <Flex justifyContent={JUSTIFY_END} flex="1">
          <SmallButton
            buttonType="primary"
            buttonCategory="rounded"
            buttonText={i18n.format(t('shared:continue'), 'capitalize')}
            onClick={handleContinue}
          />
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX="6.34375rem"
        gridGap={SPACING.spacing8}
      >
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={errorMessage != null ? COLORS.red2 : COLORS.darkBlack100}
        >
          {t('enter_network_name')}
        </StyledText>
        <InputField
          aria-label="wifi_ssid"
          value={inputSsid}
          onChange={e => setInputSsid(e.target.value)}
          type="text"
          css={SSID_INPUT_FIELD_STYLE}
          error={errorMessage}
        />
      </Flex>
      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <NormalKeyboard
          onChange={e => e != null && setInputSsid(String(e))}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </>
  )
}
