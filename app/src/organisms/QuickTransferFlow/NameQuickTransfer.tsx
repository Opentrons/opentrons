import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  Flex,
  StyledText,
  SPACING,
  DIRECTION_COLUMN,
  POSITION_FIXED,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../App/portal'
import { AlphanumericKeyboard } from '../../atoms/SoftwareKeyboard'
import { InputField } from '../../atoms/InputField'
import { ChildNavigation } from '../ChildNavigation'

interface NameQuickTransferProps {
  onSave: (protocolName: string) => void
}

export function NameQuickTransfer(props: NameQuickTransferProps): JSX.Element {
  const { onSave } = props
  const { t } = useTranslation('quick_transfer')
  const [name, setName] = React.useState('')
  const keyboardRef = React.useRef(null)

  let error: string | null = null
  if (name.length > 60) {
    error = t('character_limit_error')
  }
  // TODO add error handling for quick transfer name replication

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('name_your_transfer')}
        buttonText={t('save')}
        onClickButton={() => {
          onSave(name)
        }}
        buttonIsDisabled={name === '' || error != null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <InputField
          type="text"
          value={name}
          textAlign={TYPOGRAPHY.textAlignCenter}
        />
        <StyledText
          as="p"
          color={COLORS.grey60}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t('enter_characters')}
        </StyledText>
        <StyledText
          as="p"
          color={COLORS.red50}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {error}
        </StyledText>
        <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
          <AlphanumericKeyboard
            onChange={(input: string) => {
              setName(input)
            }}
            keyboardRef={keyboardRef}
          />
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
