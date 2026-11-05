import { css } from 'styled-components'

import { COLORS } from '../../../helix-design-system'
import { DropdownMenu } from '../../../molecules/DropdownMenu'
import { Flex, Link } from '../../../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../../styles'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'
import { StyledText } from '../../StyledText'
import { Tag } from '../../Tag/index'

import type { ReactNode } from 'react'
import type { DropdownMenuProps } from '../../../molecules/DropdownMenu'
import type { TagProps } from '../../Tag/index'

interface ListItemCustomizeProps {
  header: string
  //  this is either an image or an icon
  leftHeaderItem?: JSX.Element
  onClick?: () => void
  linkText?: string
  //  these are the middle prop options
  label?: string
  dropdown?: DropdownMenuProps
  tag?: TagProps
  /** optional placement of the menu */
  menuPlacement?: 'auto' | 'top' | 'bottom'
}

export function ListItemCustomize(props: ListItemCustomizeProps): ReactNode {
  const {
    header,
    leftHeaderItem,
    onClick,
    label,
    linkText,
    dropdown,
    tag,
    menuPlacement = 'auto',
  } = props
  return (
    <Flex
      width="100%"
      alignItems={ALIGN_CENTER}
      padding={SPACING.spacing12}
      gridGap={SPACING.spacing8}
    >
      <Flex gridGap={SPACING.spacing16} width="50%" alignItems={ALIGN_CENTER}>
        {leftHeaderItem != null ? (
          <Flex size="3.75rem">{leftHeaderItem}</Flex>
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
      </Flex>
      <Flex
        width={onClick != null && linkText != null ? '40%' : '50%'}
        gridGap={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        {label != null ? (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        ) : null}
        {dropdown != null ? (
          <DropdownMenu {...dropdown} menuPlacement={menuPlacement} />
        ) : null}
        {tag != null ? <Tag {...tag} /> : null}
      </Flex>
      {onClick != null && linkText != null ? (
        <Link role="button" onClick={onClick} css={LINK_STYLE}>
          <StyledText desktopStyle="bodyDefaultRegular">{linkText}</StyledText>
        </Link>
      ) : null}
    </Flex>
  )
}

const LINK_STYLE = css`
  width: 10%;
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
  color: ${COLORS.grey60};
  &:hover {
    color: ${COLORS.grey40};
  }
`
