// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon } from '../icons'

import styles from './forms.css'

export type CheckboxFieldProps = {|
  /** change handler */
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  /** checkbox is checked if value is true */
  value?: boolean,
  /** classes to apply */
  className?: string,
  /** classes to apply to inner label text div. Deprecated. use labelProps.className */
  labelTextClassName?: ?string,
  /** name of field in form */
  name?: string,
  /** label text for checkbox */
  label?: string,
  /** if is included, checkbox will use error style. The content of the string is ignored. */
  error?: ?string,
  /** checkbox is disabled if value is true */
  disabled?: boolean,
  /** html tabindex property */
  tabIndex?: number,
  /** props passed into label div. TODO IMMEDIATELY what is the Flow type? */
  labelProps?: { [string]: any },
|}

export function CheckboxField(props: CheckboxFieldProps): React.Node {
  const error = props.error != null
  const outerClassName = cx(styles.form_field, props.className, {
    [styles.checkbox_disabled]: props.disabled,
  })

  const innerDivClassName = cx(styles.checkbox_icon, {
    [styles.error]: error,
    [styles.checkbox_disabled]: props.disabled,
  })

  return (
    <label className={outerClassName}>
      <div className={innerDivClassName}>
        <Icon
          name={props.value ? 'checkbox-marked' : 'checkbox-blank-outline'}
          width="100%"
        />
      </div>
      <input
        className={cx(styles.input_field, styles.accessibly_hidden)}
        type="checkbox"
        name={props.name}
        checked={props.value || false}
        disabled={props.disabled}
        onChange={props.onChange}
        tabIndex={props.tabIndex}
      />
      <div
        {...props.labelProps}
        className={cx(
          props.labelTextClassName,
          props.labelProps?.className,
          styles.label_text
        )}
      >
        {props.label}
      </div>
    </label>
  )
}
