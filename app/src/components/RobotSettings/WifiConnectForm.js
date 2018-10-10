// @flow
import * as React from 'react'

import {OutlineButton, type DropdownOption} from '@opentrons/components'
import {Form, Select, TextInput} from './inputs'
import styles from './styles.css'

type Props = {
  disabled: boolean,
  activeSsid: ?string,
  networks: Array<DropdownOption>,
  onSubmit: (?string, ?string) => mixed,
}

type State = {
  ssid: ?string,
  psk: ?string,
}

type Update = {
  ssid?: string,
  psk?: string,
}

export default class ConfigureWifiForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {ssid: null, psk: null}
  }

  onChange = (update: Update) => this.setState(update)

  onSubmit = () => {
    this.props.onSubmit(this.getSsid(), this.state.psk)
    this.setState({psk: null})
  }

  getSsid (): ?string {
    return this.state.ssid || this.props.activeSsid
  }

  render () {
    const {activeSsid, networks} = this.props
    const {psk} = this.state
    const ssid = this.getSsid()
    const inputDisabled = this.props.disabled
    const formDisabled = inputDisabled || !ssid

    return (
      <Form
        onSubmit={this.onSubmit}
        disabled={formDisabled}
        className={styles.configure_form}
      >
        <label className={styles.configure_label}>
          <p>WiFi network:</p>
          <Select
            name='ssid'
            value={ssid}
            options={networks}
            disabled={inputDisabled}
            onChange={this.onChange}
            className={styles.configure_input}
          />
        </label>
        <label className={styles.configure_label}>
          <p>Password:</p>
          <TextInput
            type='password'
            name='psk'
            value={psk}
            disabled={inputDisabled}
            onChange={this.onChange}
            className={styles.configure_input}
          />
        </label>
        <OutlineButton
          type='submit'
          disabled={formDisabled}
          className={styles.configure_button}
        >
          {(ssid && ssid === activeSsid) ? 'Connected' : 'Join'}
        </OutlineButton>
      </Form>
    )
  }
}
