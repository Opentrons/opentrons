import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  SPACING,
  StyledText,
  TouchInputField,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

interface NameQuickTransferProps {
  onSave: (protocolName: string) => void
}

const MAX_CHARACTERS = 60

export function NameQuickTransfer(props: NameQuickTransferProps): JSX.Element {
  const { onSave } = props
  const { t } = useTranslation('quick_transfer')
  const [name, setName] = useState('')
  const keyboardRef = useRef(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  let error: string | null = null
  if (name.length > MAX_CHARACTERS) {
    error = t('character_limit_error')
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('name_your_transfer')}
        buttonText={t('save')}
        onClickButton={() => {
          setIsSaving(true)
          onSave(name)
        }}
        buttonIsDisabled={name === '' || error != null || isSaving}
      />
      <Flex
        // height of ChildNavigation
        marginTop={SPACING.spacing120}
        // height of keyboard
        marginBottom="13.75rem"
        // remainder of screen height
        height="16.25rem"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        padding={`0 ${SPACING.spacing60}`}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          <TouchInputField
            autoFocus
            type="text"
            value={name}
            textAlign={TYPOGRAPHY.textAlignCenter}
            onChange={e => {
              setName(e.target.value as string)
            }}
          />
          <StyledText
            oddStyle="bodyTextRegular"
            color={COLORS.grey60}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('enter_characters')}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            color={COLORS.red50}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {error}
          </StyledText>
        </Flex>
      </Flex>
      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <FullKeyboard
          onChange={(input: string) => {
            setName(input)
          }}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
