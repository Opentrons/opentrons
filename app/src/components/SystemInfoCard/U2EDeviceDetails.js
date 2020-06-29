// @flow
import {
  Box,
  Flex,
  FONT_STYLE_ITALIC,
  SPACING_1,
  SPACING_2,
  Text,
} from '@opentrons/components'
import * as React from 'react'
import styled from 'styled-components'

import { IFACE_FAMILY_IPV4 } from '../../system-info'
import type { NetworkInterface, UsbDevice } from '../../system-info/types'

// TODO(mc, 2020-04-28): i18n
const U2E_ADAPTER_DESCRIPTION =
  "The OT-2 uses a USB-to-Ethernet adapter for its wired connection. When you plug the OT-2 into your computer, this adapter will be added to your computer's device list."
const NO_ADAPTER_FOUND = 'No OT-2 USB-to-Ethernet adapter detected'
const UNKNOWN = 'unknown'
const NOT_ASSIGNED = 'Not assigned'
const NETWORK_INTERFACE = 'Network Interface'
const IPV4_ADDRESS = 'Local IPv4 Address'
const IPV6_ADDRESS = 'Local IPv6 Address'

export type U2EDeviceDetailsProps = {|
  device: UsbDevice | null,
  ifaces: Array<NetworkInterface>,
|}

const DetailText = styled.span`
  min-width: 8rem;
  margin-right: ${SPACING_1};
`

const DEVICE_STATS: Array<{| label: string, property: $Keys<UsbDevice> |}> = [
  { label: 'Description', property: 'deviceName' },
  { label: 'Manufacturer', property: 'manufacturer' },
  { label: 'Serial Number', property: 'serialNumber' },
  { label: 'Driver Version', property: 'windowsDriverVersion' },
]

const DetailItem = ({
  label,
  value,
}: {|
  label: string,
  value: string | number,
|}) => (
  <Flex as="li" marginBottom={SPACING_1}>
    <DetailText>{label}:</DetailText>
    <DetailText>{value}</DetailText>
  </Flex>
)

export const U2EDeviceDetails = ({
  device,
  ifaces,
}: U2EDeviceDetailsProps): React.Node => {
  const nwIfaceName = ifaces.length > 0 ? ifaces[0].name : NOT_ASSIGNED

  return (
    <div>
      <Text>{U2E_ADAPTER_DESCRIPTION}</Text>
      {device === null ? (
        <Text fontStyle={FONT_STYLE_ITALIC} marginTop={SPACING_2}>
          {NO_ADAPTER_FOUND}
        </Text>
      ) : (
        <Box as="ul" marginTop={SPACING_2}>
          {DEVICE_STATS.filter(({ property }) => property in device).map(
            ({ label, property }) => (
              <DetailItem
                key={label}
                label={label}
                value={device[property] ?? UNKNOWN}
              />
            )
          )}
          <DetailItem label={NETWORK_INTERFACE} value={nwIfaceName} />
          {ifaces.map(iface => (
            <DetailItem
              key={iface.address}
              label={
                iface.family === IFACE_FAMILY_IPV4 ? IPV4_ADDRESS : IPV6_ADDRESS
              }
              value={iface.address}
            />
          ))}
        </Box>
      )}
    </div>
  )
}
