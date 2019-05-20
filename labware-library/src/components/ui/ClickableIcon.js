// @flow
import * as React from 'react'
import cx from 'classnames'

import { Icon } from '@opentrons/components'
import styles from './styles.css'
import type { IconProps } from '@opentrons/components'

export type ClickableIconProps = {
  ...React.ElementProps<'button'>,
  ...$Exact<IconProps>,
}

export function ClickableIcon(props: ClickableIconProps) {
  const className = cx(styles.clickable_icon, props.className)
  return (
    <button type="button" {...props} className={className}>
      <Icon name={props.name} />
    </button>
  )
}
