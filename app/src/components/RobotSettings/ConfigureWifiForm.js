// @flow
import * as React from 'react'

import {OutlineButton, type DropdownOption} from '@opentrons/components'
import type {FormProps, InputProps} from './inputs'
import {Form, Select, TextInput} from './inputs'
import styles from './styles.css'

type Props = {
  wired: ?boolean,
  ssid: ?string,
  psk: ?string,
  activeSsid: ?string,
  networks: Array<DropdownOption>,
  onChange: $PropertyType<InputProps<*>, 'onChange'>,
  onSubmit: $PropertyType<FormProps, 'onSubmit'>,
}

export default function ConfigureWifiForm (props: Props) {
  const {
    wired,
    ssid,
    psk,
    activeSsid,
    networks,
    onChange,
    onSubmit
  } = props

  const disabled = !wired || !ssid || !psk || (ssid === activeSsid)

  return (
    <Form
      onSubmit={onSubmit}
      disabled={disabled}
      className={styles.configure_form}
    >
      <label className={styles.configure_label}>
        {'WiFi network:'}
        <Select
          name='ssid'
          value={ssid || activeSsid}
          options={networks}
          disabled={!wired}
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
          disabled={!wired}
          onChange={onChange}
          className={styles.configure_input}
        />
      </label>
      <OutlineButton
        type='submit'
        disabled={disabled}
        className={styles.configure_button}
      >
        Join
      </OutlineButton>
    </Form>
  )
}
