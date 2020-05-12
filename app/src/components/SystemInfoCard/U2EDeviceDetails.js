// @flow
import * as React from 'react'
import { css } from 'styled-components'

import { Flex, Text, FONT_STYLE_ITALIC } from '@opentrons/components'
import type { UsbDevice } from '../../system-info/types'

// TODO(mc, 2020-04-28): i18n
const U2E_ADAPTER_DESCRIPTION =
  "The OT-2 uses a USB-to-Ethernet adapter for its wired connection. When you plug the OT-2 into your computer, this adapter will be added to your computer's device list."
const NO_ADAPTER_FOUND = 'No OT-2 USB-to-Ethernet adapter detected'
const UNKNOWN = 'unknown'

export type U2EDeviceDetailsProps = {|
  device: UsbDevice | null,
|}

const MARGIN_TOP_0_5 = css`
  margin-top: 0.5rem;
`

const MARGIN_BOTTOM_0_25 = css`
  margin-bottom: 0.25rem;
`

const DETAIL_TEXT_STYLE = css`
  min-width: 6rem;
  margin-right: 0.25rem;
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
      <Text fontStyle={FONT_STYLE_ITALIC} css={MARGIN_TOP_0_5}>
        {NO_ADAPTER_FOUND}
      </Text>
    ) : (
      <ul css={MARGIN_TOP_0_5}>
        {STATS.filter(({ property }) => property in device).map(
          ({ label, property }) => (
            <Flex as="li" key={property} css={MARGIN_BOTTOM_0_25}>
              <span css={DETAIL_TEXT_STYLE}>{label}:</span>
              <span css={DETAIL_TEXT_STYLE}>{device[property] ?? UNKNOWN}</span>
            </Flex>
          )
        )}
      </ul>
    )}
  </div>
)
