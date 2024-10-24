import * as React from 'react'
import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import {
  ALIGN_CENTER,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_AUTO,
  OVERFLOW_HIDDEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { Flex } from '../../primitives'
import { Icon } from '../../icons'
import { useHoverTooltip } from '../../tooltips'
import { useOnClickOutside } from '../../interaction-enhancers'
import { LegacyStyledText } from '../../atoms/StyledText/LegacyStyledText'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Tooltip } from '../../atoms/Tooltip'
import { StyledText } from '../../atoms/StyledText'
import { LiquidIcon } from '../LiquidIcon'

/** this is the max height to display 10 items */
const MAX_HEIGHT = 316

/** this is for adjustment variable for the case that the space of the bottom and the space of the top are very close */
const HEIGHT_ADJUSTMENT = 100

export interface DropdownOption {
  name: string
  value: string
  /** optional dropdown option for adding the liquid color icon */
  liquidColor?: string
  disabled?: boolean
  tooltipText?: string
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
  tooltipText?: string | null
  /** html tabindex property */
  tabIndex?: number
  /** optional error */
  error?: string | null
  /** focus handler */
  onFocus?: React.FocusEventHandler<HTMLButtonElement>
  /** blur handler */
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
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
    error,
    onFocus,
    onBlur,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [showDropdownMenu, setShowDropdownMenu] = React.useState<boolean>(false)
  const [optionTargetProps, optionTooltipProps] = useHoverTooltip({
    placement: 'top-end',
  })

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
    if (!isDisabled) {
      setShowDropdownMenu(!showDropdownMenu)
    }
  }

  const isDisabled = filterOptions.length === 0

  let defaultBorderColor = COLORS.grey50
  let hoverBorderColor = COLORS.grey55
  if (showDropdownMenu) {
    defaultBorderColor = COLORS.blue50
    hoverBorderColor = COLORS.blue50
  } else if (error) {
    defaultBorderColor = COLORS.red50
    hoverBorderColor = COLORS.red50
  }

  const DROPDOWN_STYLE = css`
    flex-direction: ${DIRECTION_ROW};
    background-color: ${COLORS.white};
    cursor: ${isDisabled ? CURSOR_DEFAULT : CURSOR_POINTER};
    padding: ${SPACING.spacing8} ${SPACING.spacing12};
    border: 1px ${BORDERS.styleSolid} ${defaultBorderColor};
    border-radius: ${dropdownType === 'rounded'
      ? BORDERS.borderRadiusFull
      : BORDERS.borderRadius4};
    align-items: ${ALIGN_CENTER};
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    width: ${width};
    height: 2.25rem;

    &:hover {
      border: 1px ${BORDERS.styleSolid} ${hoverBorderColor};
    }

    &:active {
      border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.blue50};
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
    <Flex
      flexDirection={DIRECTION_COLUMN}
      ref={dropDownMenuWrapperRef}
      gridGap={SPACING.spacing4}
    >
      {title !== null ? (
        <Flex gridGap={SPACING.spacing8} paddingBottom={SPACING.spacing8}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {title}
          </StyledText>
          {tooltipText != null ? (
            <>
              <Flex {...targetProps}>
                <Icon
                  name="information"
                  size={SPACING.spacing12}
                  color={COLORS.grey60}
                  data-testid="information_icon"
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
          onFocus={onFocus}
          onBlur={onBlur}
          css={DROPDOWN_STYLE}
          tabIndex={tabIndex}
        >
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            {currentOption.liquidColor != null ? (
              <LiquidIcon color={currentOption.liquidColor} />
            ) : null}
            <Flex
              css={css`
                font-weight: ${dropdownType === 'rounded'
                  ? TYPOGRAPHY.pSemiBold
                  : TYPOGRAPHY.pRegular};
              `}
            >
              <StyledText desktopStyle="captionRegular" css={MENU_TEXT_STYLE}>
                {currentOption.name}
              </StyledText>
            </Flex>
          </Flex>
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
              <React.Fragment key={`${option.name}-${index}`}>
                <MenuItem
                  disabled={option.disabled}
                  zIndex={3}
                  key={`${option.name}-${index}`}
                  onClick={() => {
                    onClick(option.value)
                    setShowDropdownMenu(false)
                  }}
                  border="none"
                >
                  <Flex
                    gridGap={SPACING.spacing8}
                    alignItems={ALIGN_CENTER}
                    {...optionTargetProps}
                  >
                    {option.liquidColor != null ? (
                      <LiquidIcon color={option.liquidColor} />
                    ) : null}
                    {option.name}
                  </Flex>
                </MenuItem>
                {option.tooltipText != null ? (
                  <Tooltip tooltipProps={optionTooltipProps}>
                    {option.tooltipText}
                  </Tooltip>
                ) : null}
              </React.Fragment>
            ))}
          </Flex>
        )}
      </Flex>
      {caption != null ? (
        <LegacyStyledText as="label" color={COLORS.grey60}>
          {caption}
        </LegacyStyledText>
      ) : null}
      {error != null ? (
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.red50}>
          {error}
        </StyledText>
      ) : null}
    </Flex>
  )
}

const MENU_TEXT_STYLE = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: ${OVERFLOW_HIDDEN};
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: 1;
`
