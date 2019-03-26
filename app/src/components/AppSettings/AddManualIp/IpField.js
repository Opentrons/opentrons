// @flow
import * as React from 'react'
import {IconButton} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  field: any,
  form: any,
  inputRef: {current: null | HTMLInputElement},
}
export default function IpField (props: Props) {
  const {
    field,
    form: {submitForm, dirty},
    inputRef,
  } = props
  return (
    <div className={styles.ip_field_group}>
      <input
        {...field}
        onBlur={submitForm}
        className={styles.ip_field}
        type="text"
        ref={inputRef}
      />
      <IconButton
        className={styles.ip_button}
        name="plus"
        type="submit"
        disabled={!dirty}
      />
    </div>
  )
}
