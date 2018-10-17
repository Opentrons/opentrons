// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'
import type {HoverTooltipHandlers} from '../tooltips'

import styles from './forms.css'

type Props = {
  /** change handler */
  onChange: (event: SyntheticInputEvent<*>) => mixed,
  /** checkbox is checked if value is true */
  value?: boolean,
  /** classes to apply */
  className?: string,
  /** name of field in form */
  name?: string,
  /** label text for checkbox */
  label?: string,
  /** if is included, checkbox will use error style. The content of the string is ignored. */
  error?: ?string,
  /** checkbox is disabled if value is true */
  disabled?: boolean,
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
}

export default function CheckboxField (props: Props) {
  const error = props.error != null
  const labelClassName = cx(
    styles.form_field,
    props.className,
    {[styles.checkbox_disabled]: props.disabled})

  const innerClassName = cx(
    styles.checkbox_icon,
    {
      [styles.error]: error,
      [styles.checkbox_disabled]: props.disabled,
    })

  return (
    <label className={labelClassName}>
      <div className={innerClassName}>
        <Icon name={props.value ? 'checkbox-marked' : 'checkbox-blank-outline'} width='100%' />
      </div>
      <input
        className={cx(styles.input_field, styles.accessibly_hidden)}
        type='checkbox'
        name={props.name}
        checked={props.value || false}
        disabled={props.disabled}
        onChange={props.onChange}
      />
      <div {...props.hoverTooltipHandlers} className={styles.label_text}>
        {props.label}
      </div>
    </label>
  )
}
