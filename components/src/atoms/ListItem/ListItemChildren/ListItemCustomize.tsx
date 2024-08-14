import * as React from 'react'
import { ALIGN_CENTER } from '../../../styles'
import { COLORS } from '../../../helix-design-system'
import { Flex, Link } from '../../../primitives'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'
import { StyledText } from '../../StyledText'
import { DropdownMenu } from '../../../molecules/DropdownMenu'
import type { DropdownMenuProps } from '../../../molecules/DropdownMenu'
interface ListItemCustomizeProps {
  header: string
  image?: JSX.Element
  label?: string
  linkText?: string
  onClick?: () => void
  dropdown?: DropdownMenuProps
}

export const ListItemCustomize = (
  props: ListItemCustomizeProps
): JSX.Element => {
  const { header, image, onClick, label, linkText, dropdown } = props
  return (
    <Flex width="100%" alignItems={ALIGN_CENTER} padding={SPACING.spacing12}>
      <Flex gridGap={SPACING.spacing8} width="50%" alignItems={ALIGN_CENTER}>
        {image != null ? <Flex size="3.75rem">{image}</Flex> : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
      </Flex>
      <Flex
        width={onClick != null && linkText != null ? '40%' : '50%'}
        gridGap={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
      >
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {label}
        </StyledText>
        {dropdown != null ? <DropdownMenu {...dropdown} /> : null}
      </Flex>
      {onClick != null && linkText != null ? (
        <Flex width="10%" textDecoration={TYPOGRAPHY.textDecorationUnderline}>
          <Link role="button" onClick={onClick}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {linkText}
            </StyledText>
          </Link>
        </Flex>
      ) : null}
    </Flex>
  )
}
