import * as React from 'react'
import { useEstopQuery } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'

import { RobotOverview } from '../../../organisms/Devices/RobotOverview'
import { InstrumentsAndModules } from '../../../organisms/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '../../../organisms/Devices/RecentProtocolRuns'
import { EstopBanner } from '../../../organisms/Devices/EstopBanner'
import { DISENGAGED, useEstopContext } from '../../../organisms/EmergencyStop'

const ESTOP_STATUS_REFETCH_INTERVAL = 10000

interface DeviceDetailsComponentProps {
  robotName: string
}

export function DeviceDetailsComponent({
  robotName,
}: DeviceDetailsComponentProps): JSX.Element {
  const { data: estopStatus } = useEstopQuery({
    refetchInterval: ESTOP_STATUS_REFETCH_INTERVAL,
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
      {estopStatus?.data.status !== DISENGAGED &&
      isEmergencyStopModalDismissed ? (
        <Flex marginBottom={SPACING.spacing16}>
          <EstopBanner status={estopStatus?.data.status} />
        </Flex>
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={COLORS.white}
        border={`1px solid ${String(COLORS.medGreyEnabled)}`}
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
      <RecentProtocolRuns robotName={robotName} />
    </Box>
  )
}
