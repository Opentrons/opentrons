import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TouchInputField } from '/app/components/ODD/input/TouchInputField'
import { FullKeyboard } from '/app/components/ODD/keyboard'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

interface WifiSsidInputProps {
  errorMessage?: string | null
  inputSsid: string
  setInputSsid: Dispatch<SetStateAction<string>>
}

export function WifiSsidInput({
  errorMessage,
  inputSsid,
  setInputSsid,
}: WifiSsidInputProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared'])
  const keyboardRef = useRef(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX="6.34375rem"
        gridGap={SPACING.spacing8}
        marginTop={isUnboxingFlowOngoing ? undefined : '7.75rem'}
      >
        <StyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={errorMessage != null ? COLORS.red50 : COLORS.black90}
        >
          {t('enter_network_name')}
        </StyledText>
        <TouchInputField
          ref={inputRef}
          autoFocus
          aria-label="wifi_ssid"
          value={inputSsid}
          onChange={e => {
            setInputSsid(e.target.value)
          }}
          type="text"
          error={errorMessage}
        />
      </Flex>
      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <FullKeyboard inputElementRef={inputRef} keyboardRef={keyboardRef} />
      </Flex>
    </>
  )
}
