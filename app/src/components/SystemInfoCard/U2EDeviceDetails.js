// @flow
import * as React from 'react'
import { css } from 'styled-components'

import type { UsbDevice } from '../../system-info/types'

// TODO(mc, 2020-04-28): i18n
const U2E_ADAPTER_DESCRIPTION =
  "The OT-2 uses a USB-to-Ethernet adapter for its wired connection. When you plug the OT-2 into your computer, this adapter will be added to your computer's device list."
const NO_ADAPTER_FOUND = 'No OT-2 USB-to-Ethernet adapter detected'
const UNKNOWN = 'unknown'

export type U2EDeviceDetailsProps = {|
  device: UsbDevice | null,
|}

const NO_ADAPTER_FOUND_STYLE = css`
  font-style: italic;
  margin-top: 0.5rem;
`

const DETAIL_LIST_STYLE = css`
  margin-top: 0.5rem;
`

const DETAIL_ITEM_STYLE = css`
  display: flex;
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
  <>
    <p>{U2E_ADAPTER_DESCRIPTION}</p>
    {device === null ? (
      <p css={NO_ADAPTER_FOUND_STYLE}>{NO_ADAPTER_FOUND}</p>
    ) : (
      <ul css={DETAIL_LIST_STYLE}>
        {STATS.filter(({ property }) => property in device).map(
          ({ label, property }) => (
            <li key={property} css={DETAIL_ITEM_STYLE}>
              <span css={DETAIL_TEXT_STYLE}>{label}:</span>
              <span css={DETAIL_TEXT_STYLE}>{device[property] ?? UNKNOWN}</span>
            </li>
          )
        )}
      </ul>
    )}
  </>
)
