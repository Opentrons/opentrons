import { forwardRef } from 'react'
import styled from 'styled-components'

import {
  isDocumentedMutationError,
  usePostWifiKeysMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import type { ChangeEventHandler, ForwardedRef, ReactNode } from 'react'

export interface UploadKeyInputProps {
  robotName: string
  label: string
  onUpload: (keyId: string) => unknown
  onCancel: () => void
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
): ReactNode => {
  const { label, onUpload, onCancel, robotName } = props

  const documentationState = useDocumentationState(undefined, robotName)
  const { postWifiKeys } = usePostWifiKeysMutation(documentationState)

  const handleFileInput: ChangeEventHandler<HTMLInputElement> = event => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      event.target.value = ''

      postWifiKeys(file, {
        onSuccess: wifiKey => {
          onUpload(wifiKey.id)
        },
        onError: error => {
          // User cancelled the documentation/login modal — return to prior screen.
          if (isDocumentedMutationError(error)) {
            onCancel()
          }
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
