// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'

import { useDispatchApiRequest } from '../../../../robot-api'
import { postWifiKeys, getWifiKeyByRequestId } from '../../../../networking'
import styles from './UploadKeyInput.css'

import type { State } from '../../../../types'

export type UploadKeyInputProps = {|
  robotName: string,
  label: string,
  onUpload: (keyId: string) => mixed,
|}

const UploadKeyInputComponent = (props: UploadKeyInputProps, ref) => {
  const { robotName, label, onUpload } = props
  const [dispatchApi, requestIds] = useDispatchApiRequest()
  const handleUpload = React.useRef()

  const createdKeyId = useSelector((state: State) => {
    return getWifiKeyByRequestId(state, robotName, last(requestIds) ?? null)
  })?.id

  const handleFileInput = (event: SyntheticInputEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      event.target.value = ''

      dispatchApi(postWifiKeys(robotName, file))
    }
  }

  React.useEffect(() => {
    handleUpload.current = onUpload
  }, [onUpload])

  React.useEffect(() => {
    if (createdKeyId != null && handleUpload.current) {
      handleUpload.current(createdKeyId)
    }
  }, [createdKeyId])

  return (
    <input
      ref={ref}
      aria-label={label}
      type="file"
      onChange={handleFileInput}
      className={styles.hidden_input}
    />
  )
}

export const UploadKeyInput = React.forwardRef<
  UploadKeyInputProps,
  HTMLInputElement
>(UploadKeyInputComponent)
