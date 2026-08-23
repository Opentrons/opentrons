import { Fragment, useEffect, useRef, useState } from 'react'
import { css } from 'styled-components'

import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { StyledText } from '../../atoms/StyledText'
import { LegacyStyledText } from '../../atoms/StyledText/LegacyStyledText'
import { Tooltip } from '../../atoms/Tooltip'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { useOnClickOutside } from '../../interaction-enhancers'
import { Flex } from '../../primitives'
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
import { useHoverTooltip } from '../../tooltips'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { LiquidIcon } from '../LiquidIcon'
import { RobotInfoLabel } from '../RobotInfoLabel'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { FocusEventHandler, MouseEvent, ReactNode } from 'react'

export interface DropdownOption {
  /** dropdown option name */
  name: string
  /** dropdown option value */
  value: string
  /** optional dropdown option for adding the liquid color icon */
  liquidColor?: string
  /** optional dropdown option for adding the deck label */
  deckLabel?: string
  /** subtext below the name */
  subtext?: string
  /** optional disabled */
  disabled?: boolean
  /** optional tooltip text */
  tooltipText?: string | null
}

export type DropdownBorder = 'rounded' | 'neutral'

export type MenuPlacement = 'auto' | 'top' | 'bottom'

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
  onFocus?: FocusEventHandler<HTMLElement>
  /** blur handler */
  onBlur?: FocusEventHandler<HTMLElement>
  /** optional disabled */
  disabled?: boolean
  /** optional placement of the menu */
  menuPlacement?: MenuPlacement
  /** optional enter handler */
  onEnter?: (id: string) => void
  /** optional exit handler */
  onExit?: () => void
  /** optional test id */
  testId?: string
}

// TODO: (smb: 4/15/22) refactor this to use html select for accessibility

export function DropdownMenu(props: DropdownMenuProps): ReactNode {
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
    disabled = false,
    onFocus,
    onBlur,
    onEnter,
    onExit,
    menuPlacement = 'auto',
    testId,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [showDropdownMenu, setShowDropdownMenu] = useState<boolean>(false)
  const [optionTargetProps, optionTooltipProps] = useHoverTooltip({
    placement: 'top-end',
  })

  const [dropdownPosition, setDropdownPosition] =
    useState<Omit<MenuPlacement, 'auto'>>('bottom')
  const dropDownMenuWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowDropdownMenu(false)
    },
  })

  const menuItemsContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (
      !dropDownMenuWrapperRef.current ||
      !showDropdownMenu ||
      !menuItemsContainerRef.current ||
      menuPlacement !== 'auto'
    ) {
      return
    }

    const dropdownRect = dropDownMenuWrapperRef.current.getBoundingClientRect()
    let potentialMenuHeight = 0
    if (menuItemsContainerRef.current) {
      potentialMenuHeight = menuItemsContainerRef.current.scrollHeight
    }

    const viewportHeight = window.innerHeight
    const spaceAbove = dropdownRect.top
    const spaceBelow = viewportHeight - dropdownRect.bottom

    let newPosition: 'top' | 'bottom' = 'bottom'

    if (menuPlacement === 'auto') {
      const fitsBelow = spaceBelow >= potentialMenuHeight
      const fitsAbove = spaceAbove >= potentialMenuHeight

      if (fitsBelow) {
        newPosition = 'bottom'
      } else if (fitsAbove) {
        newPosition = 'top'
      } else {
        newPosition = spaceBelow >= spaceAbove ? 'bottom' : 'top'
      }
    } else {
      newPosition = menuPlacement
    }
    setDropdownPosition(newPosition)

    const handlePositionCalculation = (): void => {
      if (
        !dropDownMenuWrapperRef.current ||
        !showDropdownMenu ||
        !menuItemsContainerRef.current
      ) {
        return
      }
      const currentTriggerRect =
        dropDownMenuWrapperRef.current.getBoundingClientRect()
      const currentMenuHeight = menuItemsContainerRef.current.scrollHeight
      const currentViewportHeight = window.innerHeight
      const currentSpaceAbove = currentTriggerRect.top
      const currentSpaceBelow =
        currentViewportHeight - currentTriggerRect.bottom
      let determinedPosition = 'bottom'
      if (menuPlacement === 'auto') {
        const currentFitsBelow = currentSpaceBelow >= currentMenuHeight
        const currentFitsAbove = currentSpaceAbove >= currentMenuHeight
        if (currentFitsBelow) {
          determinedPosition = 'bottom'
        } else if (currentFitsAbove) {
          determinedPosition = 'top'
        } else {
          determinedPosition =
            currentSpaceBelow >= currentSpaceAbove ? 'bottom' : 'top'
        }
      } else {
        determinedPosition = menuPlacement
      }
      setDropdownPosition(determinedPosition as 'top' | 'bottom')
    }

    window.addEventListener('resize', handlePositionCalculation)
    window.addEventListener('scroll', handlePositionCalculation, true)

    return () => {
      window.removeEventListener('resize', handlePositionCalculation)
      window.removeEventListener('scroll', handlePositionCalculation, true)
    }
  }, [
    showDropdownMenu,
    filterOptions.length,
    menuPlacement,
    dropDownMenuWrapperRef,
    menuItemsContainerRef,
  ])

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
    color: ${disabled ? COLORS.grey40 : COLORS.black90};
    background-color: ${COLORS.white};
    cursor: ${isDisabled ? CURSOR_DEFAULT : CURSOR_POINTER};
    padding: ${SPACING.spacing8} ${SPACING.spacing12};
    border: 1px ${BORDERS.styleSolid}
      ${disabled ? COLORS.grey35 : defaultBorderColor};
    border-radius: ${
      dropdownType === 'rounded'
        ? BORDERS.borderRadiusFull
        : BORDERS.borderRadius4
    };
    align-items: ${ALIGN_CENTER};
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    width: ${width};
    height: 2.25rem;

    &:hover {
      border: 1px ${BORDERS.styleSolid}
        ${disabled ? COLORS.grey35 : hoverBorderColor};
    }

    &:active {
      border: 1px ${BORDERS.styleSolid} ${error ? COLORS.red50 : COLORS.blue50};
    }

    &:focus-visible {
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey55};
      outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
      outline-offset: 2px;
    }
  `
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      ref={dropDownMenuWrapperRef}
      gridGap={SPACING.spacing8}
      width={width}
    >
      {title != null ? (
        <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={disabled ? COLORS.grey35 : COLORS.grey60}
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
            e.stopPropagation()
            toggleSetShowDropdownMenu()
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          css={DROPDOWN_STYLE}
          data-testid={
            testId != null ? `${testId}_dropdownMenu` : 'dropdownMenu'
          }
          tabIndex={tabIndex}
        >
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            {currentOption.liquidColor != null ? (
              <LiquidIcon color={currentOption.liquidColor} />
            ) : null}
            {currentOption.deckLabel != null ? (
              <RobotInfoLabel
                deckLabel={currentOption.deckLabel}
                svgSize={13}
              />
            ) : null}
            <Flex
              flexDirection={DIRECTION_COLUMN}
              css={css`
                font-weight: ${
                  dropdownType === 'rounded'
                    ? TYPOGRAPHY.pSemiBold
                    : TYPOGRAPHY.pRegular
                };
              `}
            >
              {currentOption.deckLabel !== currentOption.name ? (
                <StyledText
                  desktopStyle="captionRegular"
                  css={LINE_CLAMP_TEXT_STYLE(1)}
                >
                  {currentOption.name}
                </StyledText>
              ) : null}
            </Flex>
          </Flex>
          <Icon
            size="0.75rem"
            name="menu-down"
            transform={showDropdownMenu ? 'rotate(180deg)' : undefined}
          />
        </Flex>
        {showDropdownMenu && (
          <Flex
            ref={menuItemsContainerRef}
            css={MENU_ITEM_CONTAINER_STYLE(width, dropdownPosition)}
            role="listbox"
          >
            {filterOptions.map((option, index) => (
              <Fragment key={`${option.name}-${index}`}>
                <MenuItem
                  disabled={option.disabled}
                  zIndex={3}
                  key={`${option.name}-${index}`}
                  onClick={e => {
                    onClick(option.value)
                    setShowDropdownMenu(false)
                    e.stopPropagation()
                  }}
                  border="none"
                  onMouseEnter={() => onEnter?.(option.value)}
                  onMouseLeave={onExit}
                >
                  <Flex
                    gridGap={SPACING.spacing8}
                    alignItems={ALIGN_CENTER}
                    {...optionTargetProps}
                  >
                    {option.liquidColor != null ? (
                      <LiquidIcon color={option.liquidColor} />
                    ) : null}
                    {option.deckLabel != null ? (
                      <RobotInfoLabel
                        deckLabel={option.deckLabel}
                        svgSize={13}
                      />
                    ) : null}
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={option.subtext != null ? SPACING.spacing4 : '0'}
                    >
                      {option.deckLabel !== option.name ? (
                        <StyledText
                          desktopStyle="captionRegular"
                          css={LINE_CLAMP_TEXT_STYLE(3, true)}
                        >
                          {option.name}
                        </StyledText>
                      ) : null}
                      <StyledText
                        desktopStyle="captionRegular"
                        color={COLORS.grey60}
                      >
                        {option.subtext}
                      </StyledText>
                    </Flex>
                  </Flex>
                </MenuItem>
                {option.tooltipText != null ? (
                  <Tooltip tooltipProps={optionTooltipProps}>
                    {option.tooltipText}
                  </Tooltip>
                ) : null}
              </Fragment>
            ))}
          </Flex>
        )}
      </Flex>
      {caption != null ? (
        <LegacyStyledText forwardedAs="label" color={COLORS.grey60}>
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

const MENU_ITEM_CONTAINER_STYLE = (
  width: string,
  dropdownPosition: Omit<MenuPlacement, 'auto'>
): FlattenSimpleInterpolation => css`
  position: ${POSITION_ABSOLUTE};
  z-index: 3;
  width: ${width};
  flex-direction: ${DIRECTION_COLUMN};
  border-radius: ${BORDERS.borderRadius8};
  background-color: ${COLORS.white};
  box-shadow: ${BORDERS.tinyDropShadow};
  top: ${dropdownPosition === 'bottom' ? '2.5rem' : undefined};
  bottom: ${dropdownPosition === 'top' ? '2.5rem' : undefined};
  overflow-y: ${OVERFLOW_AUTO};
  max-height: 20rem;
`

export const LINE_CLAMP_TEXT_STYLE = (
  lineClamp?: number,
  wordBreak?: boolean
): FlattenSimpleInterpolation => css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: ${OVERFLOW_HIDDEN};
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: ${lineClamp ?? 1};
  word-break: ${
    wordBreak === true ? 'normal' : 'break-all'
  }; // normal for tile and break-all for a non word case like aaaaaaaa
`
