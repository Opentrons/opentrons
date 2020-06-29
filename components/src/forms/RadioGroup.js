// @flow
import cx from 'classnames'
import * as React from 'react'

import { Icon } from '../icons'
import styles from './forms.css'

export type RadioGroupProps = {|
  /** blur handler */
  onBlur?: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  /** change handler */
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  /** value that is checked */
  value?: string,
  /** Array of {name, value} data with optional children */
  options?: Array<{|
    name: string,
    value: string,
    children?: React.Node,
  |}>,
  /** Show radio buttons inline instead of stacked */
  inline?: boolean,
  /** classes to apply to outer div */
  className?: string,
  /** classes to apply to inner label text div */
  labelTextClassName?: ?string,
  /** if is included, RadioGroup will use error style. The content of the string is ignored. */
  error?: ?string,
  /** 'name' attr of input */
  name?: string,
|}

export function RadioGroup(props: RadioGroupProps): React.Node {
  const error = props.error != null

  const outerClassName = cx({
    [styles.inline]: props.inline,
    [styles.error]: error,
  })

  const itemClassName = cx(styles.form_field, props.className, {
    [styles.inline_item]: props.inline,
  })

  return (
    <div className={outerClassName}>
      {props.options &&
        props.options.map(radio => (
          <label key={radio.value} className={itemClassName}>
            <div className={styles.checkbox_icon}>
              <Icon
                name={
                  radio.value === props.value
                    ? 'radiobox-marked'
                    : 'radiobox-blank'
                }
                width="100%"
              />
            </div>

            <input
              className={cx(styles.input_field, styles.accessibly_hidden)}
              type="radio"
              name={props.name}
              value={radio.value}
              checked={radio.value === props.value}
              onBlur={props.onBlur}
              onChange={props.onChange}
            />
            <div className={cx(props.labelTextClassName, styles.label_text)}>
              {radio.name}
            </div>
            {radio.children}
          </label>
        ))}
    </div>
  )
}
