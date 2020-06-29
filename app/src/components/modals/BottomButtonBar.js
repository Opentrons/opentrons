// @flow
// bottom button bar for modals
// TODO(mc, 2018-08-18): maybe make this the default AlertModal behavior
import type { ButtonProps } from '@opentrons/components'
import { OutlineButton } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import styles from './styles.css'

type Props = {|
  buttons: Array<?ButtonProps>,
  className?: string,
  description?: React.Node,
|}

export function BottomButtonBar(props: Props): React.Node {
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
