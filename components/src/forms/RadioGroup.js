// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '../icons'

import styles from './forms.css'

type Props = {
  /** change handler */
  onChange: (event: SyntheticInputEvent<*>) => mixed,
  /** value that is checked */
  value?: string,
  /** Array of {name, value} data with optional children */
  options?: Array<{
    name: string,
    value: string,
    children?: React.Node,
  }>,
  /** Show radio buttons inline instead of stacked */
  inline?: boolean,
  /** classes to apply */
  className?: string,
  /** if is included, RadioGroup will use error style. The content of the string is ignored. */
  error?: ?string,
}

export default function RadioGroup (props: Props) {
  const error = props.error != null

  const outerClassName = cx({
    [styles.inline]: props.inline,
    [styles.error]: error,
  })

  const itemClassName = cx(
    styles.form_field,
    props.className,
    {[styles.inline_item]: props.inline}
  )

  return (
    <div className={outerClassName}>
      {props.options && props.options.map(radio =>
        <label key={radio.value} className={itemClassName}>
          <div className={styles.checkbox_icon}>
            <Icon
              name={radio.value === props.value ? 'radiobox-marked' : 'radiobox-blank'}
              width='100%'
            />
          </div>

          <input
            className={cx(styles.input_field, styles.accessibly_hidden)}
            type='radio'
            value={radio.value}
            checked={radio.value === props.value}
            onChange={props.onChange}
          />
          <div className={styles.label_text}>{radio.name}</div>
          {radio.children}
        </label>
    )}
    </div>
  )
}
