// @flow
import type { IconName } from '@opentrons/components'
import { Icon } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import styles from './styles.css'

export type IconCtaProps = {|
  name: string,
  iconName: IconName,
  text: string,
  className?: string,
  onClick: () => mixed,
|}

export const IconCta = ({
  name,
  iconName,
  text,
  className,
  onClick,
}: IconCtaProps): React.Node => (
  <button
    name={name}
    onClick={onClick}
    className={cx(styles.icon_cta, className)}
    type="button"
  >
    <Icon name={iconName} className={styles.icon_cta_icon} />
    <span>{text}</span>
  </button>
)
