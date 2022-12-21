import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
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
import { StepMeter } from '../../atoms/StepMeter'

const SSID_INPUT_FIELD_STYLE = css`
  padding-top: ${SPACING.spacing5};
  padding-bottom: ${SPACING.spacing5};
  font-size: 2.5rem;
  line-height: 3.25rem;
  text-align: center;
`

export function SetWifiSsid(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const [inputSsid, setInputSsid] = React.useState<string>('')
  const keyboardRef = React.useRef(null)
  const history = useHistory()
  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )}  ${String(SPACING.spacingXXL)}`}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          marginBottom="2.2625rem"
        >
          <Btn onClick={() => history.push('/network-setup/wifi')}>
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
          <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
            {t('join_other_network')}
          </StyledText>
          <TertiaryButton
            width="8.9375rem"
            height="3.75rem"
            fontSize="1.5rem"
            fontWeight="500"
            lineHeight="2.0425rem"
            onClick={() =>
              history.push(
                `/network-setup/wifi/select-security-type/${inputSsid}`
              )
            }
          >
            {t('shared:next')}
          </TertiaryButton>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingX="6.34375rem"
          gridGap={SPACING.spacingSM}
        >
          <StyledText
            fontSize="1.375rem"
            lineHeight="1.875rem"
            fontWeight="500"
          >
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
      </Flex>
    </>
  )
}
