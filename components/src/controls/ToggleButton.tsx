import { css } from 'styled-components'

import { COLORS } from '../helix-design-system'
import { Icon } from '../icons'
import { Btn, Flex } from '../primitives'

import type { MouseEvent, ReactNode } from 'react'
import type { StyleProps } from '../primitives'

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

interface ToggleButtonProps extends StyleProps {
  toggledOn: boolean
  label?: string
  disabled?: boolean | null
  id?: string
  onClick?: (e: MouseEvent) => void
}

export function ToggleButton(props: ToggleButtonProps): ReactNode {
  const {
    label = 'ToggleButton',
    toggledOn,
    disabled,
    size,
    ...buttonProps
  } = props
  const iconName = toggledOn ? 'ot-toggle-input-on' : 'ot-toggle-input-off'

  return (
    <Btn
      disabled={disabled ?? false}
      role="switch"
      aria-label={label}
      aria-checked={toggledOn}
      size={size ?? '2rem'}
      css={toggledOn ? TOGGLE_ENABLED_STYLES : TOGGLE_DISABLED_STYLES}
      {...buttonProps}
    >
      <Flex>
        <Icon name={iconName} size="2rem" />
      </Flex>
    </Btn>
  )
}
