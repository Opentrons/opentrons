// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  Box,
  Text,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import * as SystemInfo from '../../system-info'
import { U2EDriverWarning } from './U2EDriverWarning'
import { U2EDeviceDetails } from './U2EDeviceDetails'

import type { State } from '../../types'

const U2E_ADAPTER_INFORMATION = 'USB-to-Ethernet Adapter Information'

export const U2EAdapterInfo = () => {
  const device = useSelector(SystemInfo.getU2EAdapterDevice)
  const ifacesMap = useSelector(SystemInfo.getU2EInterfacesMap)
  const driverOutdated = useSelector((state: State) => {
    const status = SystemInfo.getU2EWindowsDriverStatus(state)
    return status === SystemInfo.OUTDATED
  })

  return (
    <Box fontSize={FONT_SIZE_BODY_1} padding={SPACING_3}>
      <Text
        as="h3"
        fontSize={FONT_SIZE_BODY_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_2}
      >
        {U2E_ADAPTER_INFORMATION}
      </Text>
      {driverOutdated && <U2EDriverWarning marginBottom={SPACING_3} />}
      <U2EDeviceDetails
        device={device}
        ifaces={device ? ifacesMap[device.serialNumber] ?? [] : []}
      />
    </Box>
  )
}
