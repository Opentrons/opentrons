// @flow
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '@opentrons/components'
import styles from './styles.css'
import type { IconName } from '@opentrons/components'

export type IconCtaProps = {|
  iconName: IconName,
  text: string,
  className?: string,
  onClick: () => mixed,
|}

export const IconCta = ({
  iconName,
  text,
  className,
  onClick,
}: IconCtaProps) => (
  <button onClick={onClick} className={cx(styles.icon_cta, className)}>
    <Icon name={iconName} className={styles.icon_cta_icon} />
    <span>{text}</span>
  </button>
)
