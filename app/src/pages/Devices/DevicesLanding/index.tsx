import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Box,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  OVERFLOW_SCROLL,
  SIZE_6,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import { DevicesEmptyState } from '../../../organisms/Devices/DevicesEmptyState'
import { RobotSection } from '../../../organisms/Devices/RobotSection'
import { Scanning } from '../../../organisms/Devices/Scanning'
import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getScanning,
} from '../../../redux/discovery'

import type { State } from '../../../redux/types'

export function DevicesLanding(): JSX.Element {
  const { t } = useTranslation('devices_landing')

  const isScanning = useSelector((state: State) => getScanning(state))

  // TODO: rework these robot categories, extract selectors to hooks
  const connectableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )

  const robotsFound =
    connectableRobots.length > 0 ||
    reachableRobots.length > 0 ||
    unreachableRobots.length > 0

  return (
    <Box
      minWidth={SIZE_6}
      height="100%"
      overflow={OVERFLOW_SCROLL}
      padding={`${SPACING_2} ${SPACING_3}`}
    >
      <Flex>
        <Text as="h3" fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {t('devices')}
        </Text>
      </Flex>
      {isScanning ? <Scanning /> : null}
      {!isScanning && !robotsFound ? <DevicesEmptyState /> : null}
      {connectableRobots.length > 0 ? (
        <RobotSection robots={connectableRobots} />
      ) : null}
      {reachableRobots.length > 0 ? (
        <RobotSection robots={reachableRobots} />
      ) : null}
      {unreachableRobots.length > 0 ? (
        <RobotSection robots={unreachableRobots} />
      ) : null}
    </Box>
  )
}
