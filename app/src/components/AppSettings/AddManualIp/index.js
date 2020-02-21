// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../portal'
import { ManualIpForm } from './ManualIpForm'
import { IpList } from './IpList'

export type AddManualIpProps = {|
  backUrl: string,
|}

export function AddManualIp(props: AddManualIpProps) {
  return (
    <Portal>
      <AlertModal
        alertOverlay
        iconName="wifi"
        heading="Manually Add Robot Network Addresses"
        buttons={[{ Component: Link, to: props.backUrl, children: 'Done' }]}
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
