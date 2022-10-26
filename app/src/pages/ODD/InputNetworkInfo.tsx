import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  COLORS,
} from '@opentrons/components'

import { NormalKeyboard } from '../../atoms/SoftwareKeyboard'
import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { TertiaryButton } from '../../atoms/buttons'
import { ALIGN_CENTER } from '@opentrons/components'

export function InputNetworkInfo(): JSX.Element {
  const [value, setValue] = React.useState<string>('')
  const keyboardRef = React.useRef(null)
  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText fontSize="1.375rem" lineHeight="1.8725rem" fontWeight="500">
          {'Enter password'}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <InputField />
          <TertiaryButton>{'Connect'}</TertiaryButton>
        </Flex>
        <Flex width="64rem">
          <NormalKeyboard
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
