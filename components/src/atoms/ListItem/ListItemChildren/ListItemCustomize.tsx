import * as React from 'react'
import { ALIGN_CENTER } from '../../../styles'
import { COLORS } from '../../../helix-design-system'
import { Flex, Link } from '../../../primitives'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'
import { StyledText } from '../../StyledText'

interface ListItemCustomizeProps {
  header: string
  imgSrc?: string
  label?: string
  linkText?: string
  onClick?: () => void
  // dropdown
}

export const ListItemCustomize = (
  props: ListItemCustomizeProps
): JSX.Element => {
  const { header, imgSrc, onClick, label, linkText } = props
  return (
    <Flex width="100%" alignItems={ALIGN_CENTER}>
      <Flex gridGap={SPACING.spacing8} width="50%" alignItems={ALIGN_CENTER}>
        {imgSrc != null ? (
          <img src={imgSrc} width="60px" height="60px" />
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
      </Flex>
      <Flex
        width={onClick != null && linkText != null ? '30%' : '50%'}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {label}
        </StyledText>
        {/* add dropdown menu */}
      </Flex>
      {onClick != null && linkText != null ? (
        <Flex width="20%" textDecoration={TYPOGRAPHY.textDecorationUnderline}>
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
