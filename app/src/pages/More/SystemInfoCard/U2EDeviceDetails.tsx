import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  Flex,
  Text,
  FONT_STYLE_ITALIC,
  SIZE_4,
  SPACING_1,
} from '@opentrons/components'

import { U2EDriverWarning } from './U2EDriverWarning'

import type { UsbDevice } from '../../../redux/system-info/types'

export interface U2EDeviceDetailsProps {
  device: UsbDevice | null
  driverOutdated: boolean
}

const DetailText = styled.span`
  min-width: ${SIZE_4};
  margin-right: ${SPACING_1};
`

const DetailItem = ({
  label,
  value,
}: {
  label: string
  // TODO(bh, 2021-10-12): may need to type react-i18next https://react.i18next.com/latest/typescript
  value?: string | number | object | null
}): JSX.Element => (
  <Flex as="li">
    <DetailText>{label}:</DetailText>
    <DetailText>{value}</DetailText>
  </Flex>
)

export const U2EDeviceDetails = ({
  device,
  driverOutdated,
}: U2EDeviceDetailsProps): JSX.Element => {
  const { t } = useTranslation(['more_network_and_system', 'shared'])

  const DEVICE_STATS: Array<{ label: string; property: keyof UsbDevice }> = [
    { label: t('description'), property: 'deviceName' },
    { label: t('manufacturer'), property: 'manufacturer' },
    { label: t('driver_version'), property: 'windowsDriverVersion' },
  ]

  return (
    <>
      {device === null ? (
        <Text as="li" fontStyle={FONT_STYLE_ITALIC}>
          {t('no_adapter_found')}
        </Text>
      ) : (
        <>
          {driverOutdated && <U2EDriverWarning />}
          {DEVICE_STATS.filter(({ property }) => property in device).map(
            ({ label, property }) => (
              <DetailItem
                key={label}
                label={label}
                value={device[property] ?? t('shared:unknown')}
              />
            )
          )}
        </>
      )}
    </>
  )
}
