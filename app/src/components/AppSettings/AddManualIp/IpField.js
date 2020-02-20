// @flow
import * as React from 'react'
import { IconButton } from '@opentrons/components'
import styles from './styles.css'

export type IpFieldProps = {|
  field: any,
  form: any,
  inputRef: { current: null | HTMLInputElement },
|}

export function IpField(props: IpFieldProps) {
  const {
    field,
    form: { submitForm, dirty },
    inputRef,
  } = props

  return (
    <div className={styles.ip_field_group}>
      <input
        {...field}
        onBlur={event => {
          field.onBlur(event)
          if (field.value) submitForm()
        }}
        className={styles.ip_field}
        type="text"
        ref={inputRef}
      />
      <IconButton
        className={styles.add_ip_button}
        name="plus"
        type="submit"
        disabled={!dirty}
      />
    </div>
  )
}
