import { Fragment, useEffect } from 'react'
import NiceModal from '@ebay/nice-modal-react'

import { useClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import { RobotEncryptionKeyModal } from './RobotEncryptionKeyModal'

import type { ReactNode } from 'react'

export function RobotEncryptionKeyTakeover({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const { keyDisplayRequestedNonces } = useClientDataEncryptionKeys({
    refetchInterval: 1000,
  })
  useEffect(() => {
    if (
      keyDisplayRequestedNonces == null ||
      Object.keys(keyDisplayRequestedNonces).length === 0
    ) {
      NiceModal.remove(RobotEncryptionKeyModal)
    } else {
      NiceModal.show(RobotEncryptionKeyModal)
    }
  }, [keyDisplayRequestedNonces])
  return <Fragment>{children}</Fragment>
}
