import * as React from 'react'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '.'

interface SmallModalChildrenProps {
  handleCloseMaxPinsAlert: () => void
  header: string
  subText: string
  buttonText: string
}
export function SmallModalChildren(
  props: SmallModalChildrenProps
): JSX.Element {
  const { handleCloseMaxPinsAlert, header, subText, buttonText } = props

  return (
    <Modal onOutsideClick={handleCloseMaxPinsAlert} modalSize="small">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        width="100%"
      >
        <StyledText
          color={COLORS.darkBlackEnabled}
          fontSize={TYPOGRAPHY.fontSize28}
          fontWeight={TYPOGRAPHY.fontWeightBold}
          lineHeight={TYPOGRAPHY.lineHeight36}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {header}
        </StyledText>
        <StyledText
          color={COLORS.darkBlack90}
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight28}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {subText}
        </StyledText>

        <Flex marginTop={SPACING.spacing32}>
          <SmallButton
            flex="1"
            buttonText={buttonText}
            onClick={handleCloseMaxPinsAlert}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
