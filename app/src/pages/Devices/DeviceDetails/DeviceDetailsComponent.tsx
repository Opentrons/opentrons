import * as React from 'react'
import { useEstopQuery } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  Box,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'

import { DeviceDetailsDeckConfiguration } from '../../../organisms/DeviceDetailsDeckConfiguration'
import { RobotOverview } from '../../../organisms/Devices/RobotOverview'
import { InstrumentsAndModules } from '../../../organisms/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { EstopBanner } from '../../../organisms/Devices/EstopBanner'
import { DISENGAGED, useEstopContext } from '../../../organisms/EmergencyStop'
import { useIsFlex } from '../../../organisms/Devices/hooks'

interface DeviceDetailsComponentProps {
  robotName: string
}

export function DeviceDetailsComponent({
  robotName,
}: DeviceDetailsComponentProps): JSX.Element {
  const isFlex = useIsFlex(robotName)
  const { data: estopStatus, error: estopError } = useEstopQuery({
    enabled: isFlex,
  })
  const { isEmergencyStopModalDismissed } = useEstopContext()

  return (
    <Box
      minWidth="36rem"
      height="max-content"
      paddingX={SPACING.spacing16}
      paddingTop={SPACING.spacing16}
      paddingBottom={SPACING.spacing48}
    >
      {isFlex &&
      estopStatus?.data.status !== DISENGAGED &&
      estopError == null &&
      isEmergencyStopModalDismissed ? (
        <Flex marginBottom={SPACING.spacing16}>
          <EstopBanner status={estopStatus?.data.status} />
        </Flex>
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={COLORS.white}
        border={`1px solid ${String(COLORS.grey30)}`}
        borderRadius="3px"
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING.spacing16}
        paddingX={SPACING.spacing16}
        paddingBottom={SPACING.spacing4}
        width="100%"
      >
        <RobotOverview robotName={robotName} />
        <InstrumentsAndModules robotName={robotName} />
      </Flex>
      {isFlex ? <DeviceDetailsDeckConfiguration robotName={robotName} /> : null}
      <RecentProtocolRuns robotName={robotName} />
    </Box>
  )
}
