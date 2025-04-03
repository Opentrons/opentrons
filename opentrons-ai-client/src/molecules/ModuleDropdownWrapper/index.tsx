import { css } from 'styled-components'
import {
  Flex,
  SPACING,
  COLORS,
  BORDERS,
  Icon,
  StyledText,
} from '@opentrons/components'
import type { DropdownOption, DropdownBorder } from '@opentrons/components'
import { useState, useRef, useEffect } from 'react'

interface CustomDropdownProps {
  filterOptions: DropdownOption[]
  onClick: (value: string) => void
  currentOption: DropdownOption
  dropdownType?: DropdownBorder
  width?: string
  title?: string
}

// Custom dropdown implementation that doesn't rely on the DropdownMenu component
export function ModuleDropdownWrapper(props: CustomDropdownProps): JSX.Element {
  const { filterOptions, onClick, currentOption, width = '100%' } = props
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Flex
      width="100%"
      ref={dropdownRef}
      css={css`
        padding-left: 0;
        padding-right: ${SPACING.spacing16};
        position: relative;
      `}
    >
      {/* Custom dropdown trigger */}
      <Flex
        onClick={() => setIsOpen(!isOpen)}
        css={css`
          cursor: pointer;
          min-height: 2.75rem;
          padding: ${SPACING.spacing12};
          border: 1px solid ${COLORS.grey50};
          border-radius: ${BORDERS.borderRadius8};
          background-color: white;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          &:hover {
            border-color: ${COLORS.grey55};
          }
        `}
      >
        {/* Selected option text - NOT truncated */}
        <Flex
          css={css`
            flex: 1;
            padding-right: ${SPACING.spacing8};
          `}
        >
          <StyledText
            desktopStyle="bodyDefaultRegular"
            color={COLORS.black90}
            css={css`
              font-size: 0.75rem;
              line-height: 1.4;
              white-space: normal;
              word-break: normal;
              word-wrap: normal;
              hyphens: none;
              display: block;
              width: 100%;
            `}
          >
            {currentOption.name}
          </StyledText>
        </Flex>

        {/* Dropdown arrow */}
        <Icon
          name="menu-down"
          size="0.75rem"
          transform={isOpen ? 'rotate(180deg)' : undefined}
        />
      </Flex>

      {/* Dropdown options panel */}
      {isOpen && (
        <Flex
          flexDirection="column"
          css={css`
            position: absolute;
            top: 100%;
            left: 0;
            right: ${SPACING.spacing16};
            max-height: 20rem;
            overflow-y: auto;
            z-index: 10;
            background-color: white;
            border: 1px solid ${COLORS.grey40};
            border-radius: ${BORDERS.borderRadius8};
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            margin-top: 4px;
          `}
        >
          {filterOptions.map((option, index) => (
            <Flex
              key={`${option.name}-${index}`}
              onClick={() => {
                onClick(option.value)
                setIsOpen(false)
              }}
              css={css`
                padding: ${SPACING.spacing12};
                cursor: pointer;
                &:hover {
                  background-color: ${COLORS.blue10};
                }
              `}
            >
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.black90}
                css={css`
                  font-size: 0.75rem;
                  line-height: 1.4;
                  white-space: normal;
                  word-break: normal;
                  word-wrap: normal;
                  hyphens: none;
                  display: block;
                  width: 100%;
                `}
              >
                {option.name}
              </StyledText>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
}

// Special component for a dropdown with label
export function ModuleDropdownWithLabel(
  props: CustomDropdownProps & { label: string }
): JSX.Element {
  const { label, ...dropdownProps } = props

  return (
    <Flex width="100%" alignItems="center" justifyContent="flex-end">
      <Flex flex="1" />
      <StyledText
        desktopStyle="bodyDefaultRegular"
        color={COLORS.grey60}
        css={css`
          white-space: nowrap;
          margin-right: ${SPACING.spacing4};
        `}
      >
        {label}
      </StyledText>
      <Flex
        width="70%"
        css={css`
          padding-left: 0;
          padding-right: ${SPACING.spacing16};
        `}
      >
        <ModuleDropdownWrapper {...dropdownProps} />
      </Flex>
    </Flex>
  )
}
