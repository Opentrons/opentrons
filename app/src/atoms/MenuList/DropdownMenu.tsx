import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  useOnClickOutside,
  POSITION_RELATIVE,
} from '@opentrons/components'
import { MenuItem } from './MenuItem'

export interface DropdownOption {
  name: string
  value: string
}

export type DropdownBorder = 'rounded' | 'neutral'

export interface DropdownMenuProps {
  filterOptions: DropdownOption[]
  onClick: (value: string) => void
  currentOption: DropdownOption
  width?: string
  dropdownType?: DropdownBorder
  title?: string
  caption?: string | null
}

// TODO: (smb: 4/15/22) refactor this to use html select for accessibility

export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const {
    filterOptions,
    onClick,
    currentOption,
    width = '9.125rem',
    dropdownType = 'rounded',
    title,
    caption,
  } = props
  const [showDropdownMenu, setShowDropdownMenu] = React.useState<boolean>(false)
  const toggleSetShowDropdownMenu = (): void => {
    setShowDropdownMenu(!showDropdownMenu)
  }
  const dropDownMenuWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowDropdownMenu(false)
    },
  })

  const DROPDOWN_STYLE = css`
    flex-direction: ${DIRECTION_ROW};
    background-color: ${COLORS.white};
    cursor: pointer;
    padding: ${SPACING.spacing8} ${SPACING.spacing12};
    border: 1px ${BORDERS.styleSolid}
      ${showDropdownMenu ? COLORS.blue50 : COLORS.grey50};
    border-radius: ${dropdownType === 'rounded'
      ? BORDERS.borderRadiusFull
      : BORDERS.borderRadius4};
    align-items: ${ALIGN_CENTER};
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    width: ${width};
    height: 2.25rem;

    &:hover {
      border: 1px ${BORDERS.styleSolid}
        ${showDropdownMenu ? COLORS.blue50 : COLORS.grey55};
    }

    &:active {
      border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
    }

    &:focus-visible {
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey55};
      outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
      outline-offset: 2px;
    }

    &:disabled {
      background-color: ${COLORS.transparent};
      color: ${COLORS.grey40};
    }
  `

  return (
    <Flex flexDirection={DIRECTION_COLUMN} ref={dropDownMenuWrapperRef}>
      {title !== null ? (
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {title}
        </StyledText>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
        <Flex
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            toggleSetShowDropdownMenu()
          }}
          css={DROPDOWN_STYLE}
        >
          <StyledText
            css={css`
              ${dropdownType === 'rounded'
                ? TYPOGRAPHY.pSemiBold
                : TYPOGRAPHY.pRegular}
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {currentOption.name}
          </StyledText>
          {showDropdownMenu ? (
            <Icon size="1.2rem" name="menu-down" transform="rotate(180deg)" />
          ) : (
            <Icon size="1.2rem" name="menu-down" />
          )}
        </Flex>
        {showDropdownMenu && (
          <Flex
            zIndex={2}
            borderRadius={BORDERS.borderRadius8}
            boxShadow={BORDERS.tinyDropShadow}
            position={POSITION_ABSOLUTE}
            backgroundColor={COLORS.white}
            flexDirection={DIRECTION_COLUMN}
            width={width}
            top="2.5rem"
          >
            {filterOptions.map((option, index) => (
              <MenuItem
                key={`${option.name}-${index}`}
                onClick={() => {
                  onClick(option.value)
                  setShowDropdownMenu(false)
                }}
              >
                {option.name}
              </MenuItem>
            ))}
          </Flex>
        )}
      </Flex>
      {caption != null ? (
        <StyledText
          as="label"
          paddingTop={SPACING.spacing4}
          color={COLORS.grey60}
        >
          {caption}
        </StyledText>
      ) : null}
    </Flex>
  )
}
