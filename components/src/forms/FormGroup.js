// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon } from '../icons'
import styles from './forms.css'
import type { HoverTooltipHandlers } from '../tooltips'

export type FormGroupProps = {|
  /** text label */
  label?: string,
  /** form content */
  children?: React.Node,
  /** classes to apply */
  className?: ?string,
  /** if is included, FormGroup title will use error style. The content of the string is ignored. */
  error?: ?string,
  /** enable disabled style. Overridden by truthy `error` */
  disabled?: ?boolean,
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
|}

export function FormGroup(props: FormGroupProps) {
  const error = props.error != null
  const className = cx(props.className, {
    [styles.error]: error,
    [styles.disabled]: !error && props.disabled,
  })

  return (
    <div className={className}>
      {props.label && (
        <div
          {...props.hoverTooltipHandlers}
          className={styles.form_group_label}
        >
          {error && (
            <div className={styles.error_icon}>
              <Icon name="alert" />
            </div>
          )}
          {props.label}
        </div>
      )}
      {props.children}
    </div>
  )
}
