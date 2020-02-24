// @flow
import * as React from 'react'
import map from 'lodash/map'

import { SelectOptionField } from '../fields'
import styles from './styles.css'

import type { WifiKeysList } from '../../../../http-api-client'

export type SelectKeyProps = {
  name: string,
  label: string,
  value: ?string,
  error: ?string,
  required: boolean,
  keys: ?WifiKeysList,
  addKey: (file: File) => mixed,
  onValueChange: (name: string, value: ?string) => mixed,
  onLoseFocus: (name: string) => mixed,
}

const UPLOAD_KEY_VALUE = '__uploadWifiKey__'
const UPLOAD_KEY_LABEL = 'Add new...'
const UPLOAD_KEY_OPTION_GROUP = {
  options: [{ value: UPLOAD_KEY_VALUE, label: UPLOAD_KEY_LABEL }],
}

export class SelectKey extends React.Component<SelectKeyProps> {
  fileInput: ?HTMLInputElement

  constructor(props: SelectKeyProps) {
    super(props)
    this.fileInput = null
  }

  setFileInputRef = ($el: ?HTMLInputElement) => (this.fileInput = $el)

  handleInputLabelClick = () => this.fileInput && this.fileInput.click()

  handleValueChange = (name: string, value: ?string) => {
    if (value === UPLOAD_KEY_VALUE) {
      this.handleInputLabelClick()
    } else {
      this.props.onValueChange(name, value)
    }
  }

  upload = (event: SyntheticInputEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length) {
      const file: File = event.target.files[0]
      event.target.value = ''
      // $FlowFixMe: see TODO and HACK in app/src/http-api-client/networking.js
      this.props.addKey(file).then(success => {
        this.props.onValueChange(this.props.name, success.payload.response.id)
      })
    }
  }

  render() {
    const {
      name,
      label,
      value,
      error,
      required,
      keys,
      onLoseFocus,
    } = this.props
    const keyOptions = map(keys, k => ({ value: k.id, label: k.name }))

    return (
      <>
        <SelectOptionField
          {...{ name, label, value, error, required, onLoseFocus }}
          options={keyOptions.concat(UPLOAD_KEY_OPTION_GROUP)}
          onValueChange={this.handleValueChange}
        />
        <input
          type="file"
          ref={this.setFileInputRef}
          onChange={this.upload}
          className={styles.wifi_add_key_input}
          aria-label={UPLOAD_KEY_LABEL}
        />
      </>
    )
  }
}
