// @flow
// bottom button bar for modals
// TODO(mc, 2018-08-18): maybe make this the default AlertModal behavior
import * as React from 'react'
import cx from 'classnames'

import { OutlineButton } from '@opentrons/components'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'

type Props = {|
  buttons: Array<?ButtonProps>,
  className?: string,
  description?: React.Node,
|}

export function BottomButtonBar(props: Props) {
  const buttons = props.buttons.filter(Boolean)
  const className = cx(styles.bottom_button_bar, props.className)

  return (
    <div className={className}>
      {props.description}
      <div>
        {buttons.map((button, index) => (
          <OutlineButton
            {...button}
            key={index}
            className={cx(styles.bottom_button, button.className)}
          />
        ))}
      </div>
    </div>
  )
}
