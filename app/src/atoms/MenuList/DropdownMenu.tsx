import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  BORDERS,
  Icon,
  useOnClickOutside,
} from '@opentrons/components'
import { StyledText } from '../text'
import { MenuItem } from './MenuItem'

export interface DropdownOption {
  name: string
  value: string
}

export interface DropdownMenuProps {
  filterOptions: DropdownOption[]
  onClick: (value: string) => void
  currentOption: DropdownOption
  width?: string
  dropdownType?: 'rounded' | 'neutral'
}

// TODO: (smb: 4/15/22) refactor this to use html select for accessibility

export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const {
    filterOptions,
    onClick,
    currentOption,
    width = '9.125rem',
    dropdownType = 'rounded',
  } = props
  const [showDropdownMenu, setShowDropdownMenu] = React.useState<boolean>(false)
  const toggleSetShowDropdownMenu = (): void =>
    setShowDropdownMenu(!showDropdownMenu)
  const dropDownMenuWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowDropdownMenu(false),
  })

  const DROPDOWN_STYLE = css`
    flex-direction: ${DIRECTION_ROW};
    background-color: ${COLORS.white};
    cursor: pointer;
    padding: ${SPACING.spacing8};
    border: 1px ${BORDERS.styleSolid}
      ${showDropdownMenu ? COLORS.blue50 : COLORS.grey50};
    border-radius: ${dropdownType === 'rounded'
      ? BORDERS.radiusRoundEdge
      : BORDERS.radiusSoftCorners};
    align-items: ${ALIGN_CENTER};
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    width: ${width};

    &:hover {
      border: 1px ${BORDERS.styleSolid}
        ${showDropdownMenu ? COLORS.blue50 : COLORS.grey50};
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
    <>
      <Flex
        onClick={(e: MouseEvent) => {
          e.preventDefault()
          toggleSetShowDropdownMenu()
        }}
        css={DROPDOWN_STYLE}
      >
        <StyledText css={TYPOGRAPHY.pSemiBold}>{currentOption.name}</StyledText>
        {showDropdownMenu ? (
          <Icon
            height={TYPOGRAPHY.lineHeight16}
            name="menu-down"
            transform="rotate(180deg)"
          />
        ) : (
          <Icon height={TYPOGRAPHY.lineHeight16} name="menu-down" />
        )}
      </Flex>
      {showDropdownMenu && (
        <Flex
          ref={dropDownMenuWrapperRef}
          zIndex={2}
          borderRadius={BORDERS.borderRadiusSize2}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="8.5rem"
          left={SPACING.spacing16}
          flexDirection={DIRECTION_COLUMN}
          width={width}
        >
          {filterOptions.map((option, index) => (
            <MenuItem
              key={index}
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
    </>
  )
}
