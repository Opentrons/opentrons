// @flow
// labware load name with copy button
import * as React from 'react'

import { IconButton, Tooltip } from '@opentrons/components'
import { LabelText, LABEL_TOP } from '../ui'
import styles from './styles.css'

// TODO(mc, 2019-03-29): i18n
const EN_API_NAME = 'api name'
const EN_COPY_SUCCESS_MESSAGE = 'Copied to clipboard!'

const COPY_ICON = 'ot-copy-text'
const SUCCESS_TIMEOUT_MS = 1500

export type LoadNameProps = {
  loadName: string,
}

export type LoadNameState = {
  success: boolean,
}

class LoadName extends React.Component<LoadNameProps, LoadNameState> {
  inputRef: { current: HTMLInputElement | null }
  successTimeout: TimeoutID | null

  constructor(props: LoadNameProps) {
    super(props)
    this.inputRef = React.createRef()
    this.successTimeout = null
    this.state = { success: false }
  }

  // note: we could choose to always copy the entire loadName string here,
  // regardless of what the user selects, but the benefit of catching missed
  // characters doesn't seem to outweigh the annoyance of removing user control
  handleCopy = () => {
    this.setState({ success: true })
    this.cleanupSuccessTimeout()
    this.successTimeout = setTimeout(
      () => this.setState({ success: false }),
      SUCCESS_TIMEOUT_MS
    )
  }

  handleCopyButtonClick = () => {
    if (this.inputRef.current) {
      this.inputRef.current.select()
      document.execCommand('copy')
    }
  }

  cleanupSuccessTimeout() {
    if (this.successTimeout) clearTimeout(this.successTimeout)
  }

  componentWillUnmount() {
    this.cleanupSuccessTimeout()
  }

  render() {
    const { loadName } = this.props
    const { success } = this.state

    return (
      <div className={styles.load_name}>
        <label className={styles.load_name_label} onCopy={this.handleCopy}>
          <LabelText position={LABEL_TOP}>{EN_API_NAME}</LabelText>
          <input
            ref={this.inputRef}
            className={styles.load_name_input}
            type="text"
            value={loadName}
            onFocus={e => e.currentTarget.select()}
            readOnly
          />
        </label>
        <Tooltip open={success} tooltipComponent={EN_COPY_SUCCESS_MESSAGE}>
          {tooltipProps => (
            <IconButton
              onClick={this.handleCopyButtonClick}
              hoverTooltipHandlers={tooltipProps}
              className={styles.load_name_button}
              name={COPY_ICON}
              inverted
            />
          )}
        </Tooltip>
      </div>
    )
  }
}

export default LoadName
