// @flow
import * as React from 'react'
import {IconButton} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  field: any,
  form: any,
  inputRef: {current: null | HTMLInputElement},
  buttonRef: {current: null | HTMLButtonElement},
}
export default function IpField (props: Props) {
  const {
    field,
    form: {errors},
  } = props
  return (
    <div className={styles.ip_field_group}>
      <input
        {...field}
        className={styles.ip_field}
        type="text"
        ref={props.inputRef}
      />
      <IconButton
        className={styles.ip_button}
        name="plus"
        type="submit"
        disabled={errors.ip}
        ref={props.buttonRef}
      />
    </div>
  )
}
