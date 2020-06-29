// @flow
import { LabeledButton } from '@opentrons/components'
import * as React from 'react'

import { AddManualIpModal } from './AddManualIpModal'

// TODO(mc, 2020-04-27): i18n
const MANAGE = 'manage'
const ADD_IP_TITLE = 'Manually Add Robot Network Addresses'
const ADD_IP_DESCRIPTION =
  'If your app is unable to automatically discover your robot, you can manually add its IP address or hostname here'

export function AddManualIp(): React.Node {
  const [modalOpen, setModalOpen] = React.useState(false)

  return (
    <>
      <LabeledButton
        label={ADD_IP_TITLE}
        buttonProps={{ onClick: () => setModalOpen(true), children: MANAGE }}
      >
        <p>{ADD_IP_DESCRIPTION}</p>
      </LabeledButton>
      {modalOpen && <AddManualIpModal closeModal={() => setModalOpen(false)} />}
    </>
  )
}
