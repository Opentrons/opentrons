// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import { ControlSection } from '@opentrons/components'
import { getU2EAdapterDevice } from '../../system-info'
import { U2EDeviceDetails } from './U2EDeviceDetails'

const U2E_ADAPTER_INFORMATION = 'USB-to-Ethernet Adapter Information'

export const U2EAdapterInfo = () => {
  const device = useSelector(getU2EAdapterDevice)

  return (
    <ControlSection title={U2E_ADAPTER_INFORMATION}>
      <U2EDeviceDetails device={device} />
    </ControlSection>
  )
}
