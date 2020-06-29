// @flow
import * as React from 'react'

import { ScrollableAlertModal } from '../../modals'
import { Portal } from '../../portal'
import { UpdateAppMessage } from './UpdateAppMessage'

export type RestartAppModalProps = {|
  availableVersion: ?string,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
|}

export function RestartAppModal(props: RestartAppModalProps): React.Node {
  const { availableVersion, applyUpdate, closeModal } = props
  return (
    <Portal>
      <ScrollableAlertModal
        heading={`App Version ${availableVersion || ''} Downloaded`}
        buttons={[
          { onClick: closeModal, children: 'not now' },
          { onClick: applyUpdate, children: 'restart app' },
        ]}
      >
        <UpdateAppMessage downloaded />
      </ScrollableAlertModal>
    </Portal>
  )
}
