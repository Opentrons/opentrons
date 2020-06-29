// @flow
import { AlertModal } from '@opentrons/components'
import * as React from 'react'

import { Portal } from '../../portal'
import { IpList } from './IpList'
import { ManualIpForm } from './ManualIpForm'

export type AddManualIpProps = {|
  closeModal: () => mixed,
|}

export function AddManualIpModal(props: AddManualIpProps): React.Node {
  return (
    <Portal>
      <AlertModal
        alertOverlay
        iconName="wifi"
        heading="Manually Add Robot Network Addresses"
        buttons={[{ onClick: props.closeModal, children: 'Done' }]}
      >
        <p>
          Enter an IP address or hostname to connect to your robot if automatic
          discovery is not working. For this feature to work reliably, you (or
          your network administrator) should assign a static IP address to your
          robot.
        </p>
        <ManualIpForm />
        <IpList />
      </AlertModal>
    </Portal>
  )
}
