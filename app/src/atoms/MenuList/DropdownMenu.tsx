import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  SPACING,
  LEGACY_COLORS,
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
}

// TODO: (smb: 4/15/22) refactor this to use html select for accessibility

export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const { filterOptions, onClick, currentOption } = props
  const [showDropdownMenu, setShowDropdownMenu] = React.useState<boolean>(false)
  const toggleSetShowDropdownMenu = (): void =>
    setShowDropdownMenu(!showDropdownMenu)
  const dropDownMenuWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowDropdownMenu(false),
  })

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="9.125rem"
        onClick={toggleSetShowDropdownMenu}
        border={BORDERS.lineBorder}
        borderRadius={BORDERS.radiusRoundEdge}
        padding={SPACING.spacing8}
        backgroundColor={COLORS.white}
        css={css`
          cursor: pointer;
        `}
      >
        <StyledText css={TYPOGRAPHY.pSemiBold}>{currentOption.name}</StyledText>
        <Icon
          height={TYPOGRAPHY.lineHeight16}
          name={showDropdownMenu ? 'chevron-up' : 'chevron-down'}
        />
      </Flex>
      {showDropdownMenu && (
        <Flex
          ref={dropDownMenuWrapperRef}
          zIndex={2}
          borderRadius={BORDERS.radiusSoftCorners}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="8.5rem"
          left={SPACING.spacing16}
          flexDirection={DIRECTION_COLUMN}
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
