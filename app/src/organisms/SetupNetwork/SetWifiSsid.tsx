import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  JUSTIFY_END,
  ALIGN_CENTER,
  POSITION_FIXED,
  SPACING,
  Btn,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { TertiaryButton } from '../../atoms/buttons'
import { NormalKeyboard } from '../../atoms/SoftwareKeyboard'
import { JOIN_OTHER } from '../Devices/RobotSettings/ConnectNetwork/constants'

import type { NetworkChangeState } from '../Devices/RobotSettings/ConnectNetwork/types'

const SSID_INPUT_FIELD_STYLE = css`
  padding-top: ${SPACING.spacing5};
  padding-bottom: ${SPACING.spacing5};
  font-size: 2.5rem;
  line-height: 3.25rem;
  text-align: center;
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
  const { t } = useTranslation(['device_settings', 'shared'])
  const [inputSsid, setInputSsid] = React.useState<string>('') // Need to remove since need to pass typed ssid
  const keyboardRef = React.useRef(null)

  const handleNext = (): void => {
    setSelectedSsid(inputSsid)
    setShowSelectAuthenticationType(true)
    setChangeState({ type: JOIN_OTHER, ssid: inputSsid })
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
          <Btn onClick={() => setChangeState({ type: null })}>
            <Flex flexDirection={DIRECTION_ROW}>
              <Icon
                name="arrow-back"
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
        </Flex>
        <Flex justifyContent={JUSTIFY_CENTER} flex="1">
          <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
            {t('join_other_network')}
          </StyledText>
        </Flex>
        <Flex justifyContent={JUSTIFY_END} flex="1">
          <TertiaryButton
            width="8.9375rem"
            height="3.75rem"
            fontSize="1.5rem"
            fontWeight="500"
            lineHeight="2.0425rem"
            onClick={handleNext}
          >
            {t('shared:next')}
          </TertiaryButton>
        </Flex>
      </Flex>

      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX="6.34375rem"
        gridGap={SPACING.spacingSM}
      >
        <StyledText fontSize="1.375rem" lineHeight="1.875rem" fontWeight="500">
          {t('enter_ssid')}
        </StyledText>
        <InputField
          aria-label="wifi_ssid"
          value={inputSsid}
          onChange={e => setInputSsid(e.target.value)}
          type="text"
          css={SSID_INPUT_FIELD_STYLE}
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
