import clsx from 'clsx'

import { Icon } from '../../icons'
import { LegacyStyledText } from '../StyledText'

import '@opentrons/components/styles'

import styles from './Chip.module.css'

import type { IconName } from '../../icons'

export type ChipType = 'error' | 'info' | 'neutral' | 'success' | 'warning'

type ChipSize = 'medium' | 'small'

interface ChipProps {
  /** Display background color? */
  background?: boolean
  /** Chip icon */
  iconName?: IconName
  /** Chip content */
  text: string
  /** name constant of the text color and the icon color to display */
  type: ChipType
  /** has icon */
  hasIcon?: boolean
  /** Chip size medium is the default size */
  chipSize?: ChipSize
  /** icon should pulse */
  pulseIcon?: boolean
}

const CHIP_PROPS_BY_TYPE: Record<
  ChipType,
  {
    iconName?: IconName
  }
> = {
  error: {},
  info: {},
  neutral: {},
  success: {
    iconName: 'ot-check',
  },
  warning: {},
}

export function Chip(props: ChipProps): JSX.Element {
  const {
    background,
    iconName,
    type,
    text,
    hasIcon = true,
    chipSize = 'medium',
    pulseIcon = false,
  } = props

  const icon = iconName ?? CHIP_PROPS_BY_TYPE[type].iconName ?? 'ot-alert'

  const containerClasses = clsx(styles.chip_container, styles[chipSize], {
    [styles[type]]: background !== false,
    [styles.transparent]: background === false,
    [styles.no_background]: background === false,
  })

  const iconClasses = clsx(
    {
      [styles.icon]: chipSize === 'medium',
      [styles.icon_small]:
        chipSize === 'small' && iconName !== 'connection-status',
      [styles.icon_small_connection_status]:
        chipSize === 'small' && iconName === 'connection-status',
    },
    styles[`icon_${type}`]
  )

  const textClasses = clsx(
    chipSize === 'medium' ? styles.text_medium : styles.text_small,
    styles[`text_${type}`]
  )

  return (
    <div className={containerClasses} data-testid={`Chip_${type}`}>
      {hasIcon ? (
        <Icon name={icon} className={iconClasses} aria-label={`icon_${text}`}>
          {pulseIcon ? (
            <animate
              attributeName="fill"
              values="currentColor; transparent"
              dur="1s"
              calcMode="discrete"
              repeatCount="indefinite"
              data-testid={`Chip_${type}_icon_animate`}
            />
          ) : null}
        </Icon>
      ) : null}
      <LegacyStyledText className={textClasses}>{text}</LegacyStyledText>
    </div>
  )
}
