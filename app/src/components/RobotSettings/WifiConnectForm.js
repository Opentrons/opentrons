// @flow
import * as React from 'react'

import {OutlineButton, type DropdownOption} from '@opentrons/components'
import type {FormProps, InputProps} from './inputs'
import {Form, Select, TextInput} from './inputs'
import styles from './styles.css'

type Props = {
  disabled: boolean,
  ssid: ?string,
  psk: ?string,
  activeSsid: ?string,
  networks: Array<DropdownOption>,
  onChange: $PropertyType<InputProps<*>, 'onChange'>,
  onSubmit: $PropertyType<FormProps, 'onSubmit'>,
}

export default function ConfigureWifiForm (props: Props) {
  const {
    ssid,
    psk,
    activeSsid,
    networks,
    onChange,
    onSubmit
  } = props

  const inputDisabled = props.disabled
  const formDisabled = inputDisabled || !ssid || !psk || (ssid === activeSsid)

  return (
    <Form
      onSubmit={onSubmit}
      disabled={formDisabled}
      className={styles.configure_form}
    >
      <label className={styles.configure_label}>
        {'WiFi network:'}
        <Select
          name='ssid'
          value={ssid || activeSsid}
          options={networks}
          disabled={inputDisabled}
          onChange={onChange}
          className={styles.configure_input}
        />
      </label>
      <label className={styles.configure_label}>
        {'Password:'}
        <TextInput
          type='password'
          name='psk'
          value={psk}
          disabled={inputDisabled}
          onChange={onChange}
          className={styles.configure_input}
        />
      </label>
      <OutlineButton
        type='submit'
        disabled={formDisabled}
        className={styles.configure_button}
      >
        Join
      </OutlineButton>
    </Form>
  )
}
