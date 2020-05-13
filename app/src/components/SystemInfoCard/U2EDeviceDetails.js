// @flow
import * as React from 'react'
import styled from 'styled-components'

import {
  Box,
  Flex,
  Text,
  FONT_STYLE_ITALIC,
  SPACING_1,
  SPACING_2,
} from '@opentrons/components'

import type { UsbDevice } from '../../system-info/types'

// TODO(mc, 2020-04-28): i18n
const U2E_ADAPTER_DESCRIPTION =
  "The OT-2 uses a USB-to-Ethernet adapter for its wired connection. When you plug the OT-2 into your computer, this adapter will be added to your computer's device list."
const NO_ADAPTER_FOUND = 'No OT-2 USB-to-Ethernet adapter detected'
const UNKNOWN = 'unknown'

export type U2EDeviceDetailsProps = {|
  device: UsbDevice | null,
|}

const DetailText = styled.span`
  min-width: 6rem;
  margin-right: ${SPACING_1};
`

const STATS: Array<{| label: string, property: $Keys<UsbDevice> |}> = [
  { label: 'Description', property: 'deviceName' },
  { label: 'Manufacturer', property: 'manufacturer' },
  { label: 'Serial Number', property: 'serialNumber' },
  { label: 'Driver Version', property: 'windowsDriverVersion' },
]

export const U2EDeviceDetails = ({ device }: U2EDeviceDetailsProps) => (
  <div>
    <Text>{U2E_ADAPTER_DESCRIPTION}</Text>
    {device === null ? (
      <Text fontStyle={FONT_STYLE_ITALIC} marginTop={SPACING_2}>
        {NO_ADAPTER_FOUND}
      </Text>
    ) : (
      <Box as="ul" marginTop={SPACING_2}>
        {STATS.filter(({ property }) => property in device).map(
          ({ label, property }) => (
            <Flex as="li" key={property} marginBottom={SPACING_1}>
              <DetailText>{label}:</DetailText>
              <DetailText>{device[property] ?? UNKNOWN}</DetailText>
            </Flex>
          )
        )}
      </Box>
    )}
  </div>
)
