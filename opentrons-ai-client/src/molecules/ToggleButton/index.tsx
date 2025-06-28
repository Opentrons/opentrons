import { css } from 'styled-components'

import { Btn, COLORS, Flex, Icon } from '@opentrons/components'

import type { MouseEvent } from 'react'

interface ToggleButtonProps {
  toggledOn: boolean
  label?: string
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
}

export function ToggleButton(props: ToggleButtonProps): JSX.Element {
  const { label, toggledOn, disabled, onClick } = props
  const iconName = toggledOn ? 'ot-toggle-input-on' : 'ot-toggle-input-off'

  return (
    <Btn
      disabled={disabled ?? false}
      role="switch"
      aria-label={label}
      aria-checked={toggledOn}
      size="2rem"
      css={props.toggledOn ? TOGGLE_ENABLED_STYLES : TOGGLE_DISABLED_STYLES}
      onClick={onClick}
      data-testid={`ToggleButton_${label ?? 'label'}`}
    >
      <Flex>
        <Icon name={iconName} size="2rem" />
      </Flex>
    </Btn>
  )
}

const TOGGLE_DISABLED_STYLES = css`
  color: ${COLORS.grey50};

  &:hover {
    color: ${COLORS.grey55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey30};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blue50};

  &:hover {
    color: ${COLORS.blue55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey30};
  }
`
