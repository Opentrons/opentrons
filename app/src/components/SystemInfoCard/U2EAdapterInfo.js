// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Text,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import * as SystemInfo from '../../system-info'
import { U2EDriverWarning } from './U2EDriverWarning'
import { U2EDeviceDetails } from './U2EDeviceDetails'

import type { State } from '../../types'

const U2E_ADAPTER_INFORMATION = 'USB-to-Ethernet Adapter Information'

export const U2EAdapterInfo = () => {
  const device = useSelector(SystemInfo.getU2EAdapterDevice)
  const driverOutdated = useSelector((state: State) => {
    const status = SystemInfo.getU2EWindowsDriverStatus(state)
    return status === SystemInfo.OUTDATED
  })

  return (
    <div
      css={css`
        font-size: ${FONT_SIZE_BODY_1};
        padding: 1rem;
      `}
    >
      <Text
        as="h3"
        fontSize={FONT_SIZE_BODY_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        css={css`
          margin-bottom: 0.5rem;
        `}
      >
        {U2E_ADAPTER_INFORMATION}
      </Text>
      {driverOutdated && (
        <U2EDriverWarning
          css={css`
            margin-bottom: 1rem;
          `}
        />
      )}
      <U2EDeviceDetails device={device} />
    </div>
  )
}
