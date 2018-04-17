// @flow
import * as React from 'react'
import cx from 'classnames'

import Button, {type ButtonProps} from './Button'
import styles from './buttons.css'

type GroupProps = {
  /** Array of `ButtonProps` for each `ButtonItem` in the `ButtonGroup` */
  buttons: Array<ButtonProps & {active: boolean}>,
  /** inverts the default color/background/border of default button style */
  inverted?: boolean,
  className?: string
}

/**
 * Group of Buttons with no background fill except for active/selected button
 */
export default function ButtonGroup (props: GroupProps) {
  const {buttons} = props
  const className = cx(styles.button_group, props.className, {[styles.inverted]: props.inverted})
  return (
    <div className={className}>
      {buttons.filter(Boolean).map((button, index) => (
        <Button
          key={index}
          {...button}
          className={cx(
            styles.button_item,
            button.className,
            {[styles.button_item_active]: button.active}
          )}
          />
      ))}
    </div>
  )
}
