// @flow
// labware load name with copy button
import * as React from 'react'

import { IconButton, DeprecatedTooltip } from '@opentrons/components'
import { LabelText, LABEL_TOP } from '../ui'

import { API_NAME, COPIED_TO_CLIPBOARD } from '../../localization'
import styles from './styles.css'

const COPY_ICON = 'ot-copy-text'
const SUCCESS_TIMEOUT_MS = 1500

export type LoadNameProps = {|
  loadName: string,
|}

export function LoadName(props: LoadNameProps): React.Node {
  const { loadName } = props
  const [success, setSuccess] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const successTimeout = React.useRef<TimeoutID | null>(null)
  const cleanupSuccessTimeout = () => {
    if (successTimeout.current) clearTimeout(successTimeout.current)
  }

  React.useEffect(() => cleanupSuccessTimeout, [])

  // note: we could choose to always copy the entire loadName string here,
  // regardless of what the user selects, but the benefit of catching missed
  // characters doesn't seem to outweigh the annoyance of removing user control
  const handleCopy = () => {
    setSuccess(true)
    cleanupSuccessTimeout()
    successTimeout.current = setTimeout(
      () => setSuccess(false),
      SUCCESS_TIMEOUT_MS
    )
  }

  const handleCopyButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.select()
      document.execCommand('copy')
    }
  }

  return (
    <div className={styles.load_name}>
      <label className={styles.load_name_label} onCopy={handleCopy}>
        <LabelText position={LABEL_TOP}>{API_NAME}</LabelText>
        <input
          ref={inputRef}
          className={styles.load_name_input}
          type="text"
          value={loadName}
          onFocus={e => e.currentTarget.select()}
          readOnly
        />
      </label>
      <DeprecatedTooltip open={success} tooltipComponent={COPIED_TO_CLIPBOARD}>
        {tooltipProps => (
          <IconButton
            onClick={handleCopyButtonClick}
            hoverTooltipHandlers={tooltipProps}
            className={styles.load_name_button}
            name={COPY_ICON}
            inverted
          />
        )}
      </DeprecatedTooltip>
    </div>
  )
}
