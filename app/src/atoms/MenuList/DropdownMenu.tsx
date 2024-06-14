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
  useHoverTooltip,
  OVERFLOW_AUTO,
} from '@opentrons/components'
import { Tooltip } from '../Tooltip'
import { MenuItem } from './MenuItem'

/** this is the max height to display 10 items */
const MAX_HEIGHT = 316

/** this is for adjustment variable for the case that the space of the bottom and the space of the top are very close */
const HEIGHT_ADJUSTMENT = 100

export interface DropdownOption {
  name: string
  value: string
}

export type DropdownBorder = 'rounded' | 'neutral'

export interface DropdownMenuProps {
  /** dropdown options */
  filterOptions: DropdownOption[]
  /** click handler */
  onClick: (value: string) => void
  /** current selected option */
  currentOption: DropdownOption
  /** dropdown */
  width?: string
  /** dropdown style type  */
  dropdownType?: DropdownBorder
  /** dropdown title */
  title?: string
  /** dropdown item caption */
  caption?: string | null
  /** text for tooltip */
  tooltipText?: string
  /** html tabindex property */
  tabIndex?: number
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
    tooltipText,
    tabIndex = 0,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [showDropdownMenu, setShowDropdownMenu] = React.useState<boolean>(false)

  const [dropdownPosition, setDropdownPosition] = React.useState<
    'top' | 'bottom'
  >('bottom')

  const dropDownMenuWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowDropdownMenu(false)
    },
  })

  React.useEffect(() => {
    const handlePositionCalculation = (): void => {
      const dropdownRect = dropDownMenuWrapperRef.current?.getBoundingClientRect()
      if (dropdownRect != null) {
        const parentElement = dropDownMenuWrapperRef?.current?.parentElement
        const grandParentElement = parentElement?.parentElement?.parentElement
        let availableHeight = window.innerHeight
        let scrollOffset = 0

        if (grandParentElement != null) {
          const grandParentRect = grandParentElement.getBoundingClientRect()
          availableHeight = grandParentRect.bottom - grandParentRect.top
          scrollOffset = grandParentRect.top
        } else if (parentElement != null) {
          const parentRect = parentElement.getBoundingClientRect()
          availableHeight = parentRect.bottom - parentRect.top
          scrollOffset = parentRect.top
        }

        const downSpace =
          filterOptions.length + 1 > 10
            ? MAX_HEIGHT
            : (filterOptions.length + 1) * 34
        const dropdownBottom = dropdownRect.bottom + downSpace - scrollOffset

        setDropdownPosition(
          dropdownBottom > availableHeight &&
            Math.abs(dropdownBottom - availableHeight) > HEIGHT_ADJUSTMENT
            ? 'top'
            : 'bottom'
        )
      }
    }

    window.addEventListener('resize', handlePositionCalculation)
    window.addEventListener('scroll', handlePositionCalculation)
    handlePositionCalculation()

    return () => {
      window.removeEventListener('resize', handlePositionCalculation)
      window.removeEventListener('scroll', handlePositionCalculation)
    }
  }, [filterOptions.length, dropDownMenuWrapperRef])

  const toggleSetShowDropdownMenu = (): void => {
    setShowDropdownMenu(!showDropdownMenu)
  }

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
        <Flex gridGap={SPACING.spacing8}>
          <StyledText
            as="label"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            paddingBottom={SPACING.spacing8}
          >
            {title}
          </StyledText>
          {tooltipText != null ? (
            <>
              <Flex {...targetProps}>
                <Icon
                  name="information"
                  size={SPACING.spacing12}
                  color={COLORS.grey60}
                />
              </Flex>
              <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
            </>
          ) : null}
        </Flex>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
        <Flex
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            toggleSetShowDropdownMenu()
          }}
          css={DROPDOWN_STYLE}
          tabIndex={tabIndex}
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
            <Icon size="0.75rem" name="menu-down" transform="rotate(180deg)" />
          ) : (
            <Icon size="0.75rem" name="menu-down" />
          )}
        </Flex>
        {showDropdownMenu && (
          <Flex
            zIndex={3}
            borderRadius={BORDERS.borderRadius8}
            boxShadow={BORDERS.tinyDropShadow}
            position={POSITION_ABSOLUTE}
            backgroundColor={COLORS.white}
            flexDirection={DIRECTION_COLUMN}
            width={width}
            top={dropdownPosition === 'bottom' ? '2.5rem' : undefined}
            bottom={dropdownPosition === 'top' ? '2.5rem' : undefined}
            overflowY={OVERFLOW_AUTO}
            maxHeight="20rem" // Set the maximum display number to 10.
          >
            {filterOptions.map((option, index) => (
              <MenuItem
                zIndex="3"
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
