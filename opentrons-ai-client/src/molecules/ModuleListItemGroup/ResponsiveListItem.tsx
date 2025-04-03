import { css } from 'styled-components'
import {
  Flex,
  SPACING,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  ListItem,
  StyledText,
} from '@opentrons/components'
import type { DropdownOption, DropdownBorder } from '@opentrons/components'
import {
  ModuleDropdownWrapper,
  ModuleDropdownWithLabel,
} from '../ModuleDropdownWrapper'

interface ModuleListItemResponsiveProps {
  header: string
  leftHeaderItem?: JSX.Element
  linkText?: string
  label?: string
  dropdownProps?: {
    filterOptions: DropdownOption[]
    onClick: (value: string) => void
    currentOption: DropdownOption
    dropdownType?: DropdownBorder
    title?: string
  }
  onClick?: () => void
}

export function ModuleListItemResponsive(
  props: ModuleListItemResponsiveProps
): JSX.Element {
  const {
    header,
    leftHeaderItem,
    linkText,
    label,
    dropdownProps,
    onClick,
  } = props

  return (
    <Flex width="100%" alignItems={ALIGN_CENTER} padding={SPACING.spacing12}>
      {/* Module name and icon section */}
      <Flex
        gridGap={SPACING.spacing16}
        alignItems={ALIGN_CENTER}
        css={css`
          flex: 0 0 auto;
          min-width: 180px;
          max-width: 35%;
        `}
      >
        {leftHeaderItem != null ? (
          <Flex size="3.75rem">{leftHeaderItem}</Flex>
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
      </Flex>

      {/* Middle section with dropdown */}
      <Flex
        css={css`
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          align-items: center;
        `}
      >
        {label && dropdownProps ? (
          <ModuleDropdownWithLabel label={label} {...dropdownProps} />
        ) : dropdownProps ? (
          <ModuleDropdownWrapper {...dropdownProps} />
        ) : null}
      </Flex>

      {/* Remove button section */}
      {onClick != null && linkText != null ? (
        <Flex
          role="button"
          onClick={onClick}
          css={css`
            flex: 0 0 auto;
            min-width: 60px;
            text-align: center;
            padding-left: ${SPACING.spacing16};
            padding-right: ${SPACING.spacing8};
            color: ${COLORS.grey60};
            text-decoration: underline;
            cursor: pointer;
            &:hover {
              color: ${COLORS.grey40};
            }
          `}
        >
          <StyledText desktopStyle="bodyDefaultRegular">{linkText}</StyledText>
        </Flex>
      ) : null}
    </Flex>
  )
}
