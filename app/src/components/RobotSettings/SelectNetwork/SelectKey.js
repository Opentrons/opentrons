// @flow
import * as React from 'react'
import find from 'lodash/find'
import map from 'lodash/map'

import {SelectOptionField} from './fields'
import styles from './styles.css'

import type {WifiKeysList} from '../../../http-api-client'

type Props = {
  name: string,
  label: string,
  value: ?string,
  error: ?string,
  required: boolean,
  keys: ?WifiKeysList,
  addKey: File => mixed,
  onValueChange: (name: string, value: ?string) => mixed,
  onLoseFocus: (name: string) => mixed,
}

type State = {
  nextKeyName: ?string,
}

const UPLOAD_KEY_VALUE = '__uploadWifiKey__'
const UPLOAD_KEY_LABEL = 'Add new...'

export default class SelectKey extends React.Component<Props, State> {
  fileInput: ?HTMLInputElement

  constructor (props: Props) {
    super(props)
    this.fileInput = null
    this.state = {nextKeyName: null}
  }

  setFileInputRef = ($el: ?HTMLInputElement) => (this.fileInput = $el)

  handleInputLabelClick = () => this.fileInput && this.fileInput.click()

  upload = (event: SyntheticInputEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length) {
      const file: File = event.target.files[0]
      event.target.value = ''
      this.props.addKey(file)
      this.props.onValueChange(this.props.name, null)
      this.setState({nextKeyName: file.name})
    }
  }

  handleValueChange = (name: string, value: ?string) => {
    if (value !== UPLOAD_KEY_VALUE) {
      this.props.onValueChange(name, value)
    }
  }

  componentDidUpdate (prevProps: Props) {
    const {name, keys, value} = this.props
    const {nextKeyName} = this.state

    if (!value && nextKeyName && keys !== prevProps.keys) {
      // TODO(mc, 2018-10-24): this will select an arbitrary key file if the
      // user uploads multiple keys with the same filename; see TODO in
      // api/src/opentrons/server/endpoints/networking.py::list_keys
      const nextKey = find(keys, {name: nextKeyName})
      if (nextKey) {
        this.handleValueChange(name, nextKey.id)
        this.setState({nextKeyName: null})
      }
    }
  }

  render () {
    const {name, label, value, error, required, keys, onLoseFocus} = this.props
    const keyOptions = map(keys, k => ({value: k.id, label: k.name}))
    const addNewGroup = {
      label: null,
      options: [
        {
          value: UPLOAD_KEY_VALUE,
          label: (
            <div onClick={this.handleInputLabelClick} aria-hidden>
              {UPLOAD_KEY_LABEL}
            </div>
          ),
        },
      ],
    }

    return (
      <React.Fragment>
        <SelectOptionField
          {...{name, label, value, error, required, onLoseFocus}}
          options={keyOptions.concat(addNewGroup)}
          onValueChange={this.handleValueChange}
        />
        <input
          type="file"
          ref={this.setFileInputRef}
          onChange={this.upload}
          className={styles.wifi_add_key_input}
          aria-label={UPLOAD_KEY_LABEL}
        />
      </React.Fragment>
    )
  }
}
