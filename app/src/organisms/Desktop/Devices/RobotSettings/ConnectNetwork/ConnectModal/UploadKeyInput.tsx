import { forwardRef } from 'react'
import styled from 'styled-components'

import { usePostWifiKeysMutation } from '@opentrons/react-api-client'

import type { ChangeEventHandler, ForwardedRef } from 'react'

export interface UploadKeyInputProps {
  robotName: string
  label: string
  onUpload: (keyId: string) => unknown
}

// TODO(mc, 2020-03-04): create styled HiddenInput in components library
const HiddenInput = styled.input`
  position: absolute;
  overflow: hidden;
  clip: rect(0 0 0 0);
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
`

const UploadKeyInputComponent = (
  props: UploadKeyInputProps,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element => {
  const { label, onUpload } = props

  const { postWifiKeys } = usePostWifiKeysMutation()

  const handleFileInput: ChangeEventHandler<HTMLInputElement> = event => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      event.target.value = ''

      postWifiKeys(file, {
        onSuccess: wifiKey => {
          onUpload(wifiKey.id)
        },
      })
    }
  }

  return (
    <HiddenInput
      ref={ref}
      aria-label={label}
      type="file"
      onChange={handleFileInput}
    />
  )
}

export const UploadKeyInput = forwardRef<HTMLInputElement, UploadKeyInputProps>(
  UploadKeyInputComponent
)
