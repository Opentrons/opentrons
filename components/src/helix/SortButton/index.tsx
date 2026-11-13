import clsx from 'clsx'

import { StyledText } from '../../atoms'
import { Icon } from '../../helix/icons'
import styles from './sortbutton.module.css'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

interface SortButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick' | 'children'
> {
  label: string
  active: boolean
  direction: SortDirection
  onClick: () => void
}

const UP_ICON = 'chevron-up'
const DOWN_ICON = 'chevron-down'

export function SortButton(props: SortButtonProps): ReactNode {
  const { label, active, direction, onClick, className, ...rest } = props // aria-label should be supported by rest
  const icon = direction === 'asc' ? UP_ICON : DOWN_ICON

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(styles.button_container, className)}
      {...rest}
    >
      <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      <Icon
        name={icon}
        size="1rem"
        className={styles.icon}
        aria-hidden="true"
      />
    </button>
  )
}
