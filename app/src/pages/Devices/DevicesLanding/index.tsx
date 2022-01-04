import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Box,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import { DevicesEmptyState } from '../../../organisms/Devices/DevicesEmptyState'
import { Scanning } from '../../../organisms/Devices/Scanning'
import { getScanning } from '../../../redux/discovery'

import type { State } from '../../../redux/types'

export function DevicesLanding(): JSX.Element {
  const { t } = useTranslation('devices_landing')

  const isScanning = useSelector((state: State) => getScanning(state))

  // TODO: replace with actual robots found
  const robotsFound = false

  return (
    <Box minWidth="320px" padding={`${SPACING_2} ${SPACING_3}`}>
      <Flex>
        <Text as="h3" fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {t('devices')}
        </Text>
      </Flex>
      {isScanning ? <Scanning /> : null}
      {!isScanning && !robotsFound ? <DevicesEmptyState /> : null}
    </Box>
  )
}
