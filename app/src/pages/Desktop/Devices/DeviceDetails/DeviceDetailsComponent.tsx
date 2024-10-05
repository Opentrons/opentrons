import { useEstopQuery } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  Box,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'

import { DeviceDetailsDeckConfiguration } from '/app/organisms/DeviceDetailsDeckConfiguration'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { EstopBanner } from '/app/organisms/Desktop/Devices/EstopBanner'
import { DISENGAGED, useEstopContext } from '/app/organisms/EmergencyStop'
import { useIsFlex } from '/app/redux-resources/robots'

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
        borderRadius={BORDERS.borderRadius8}
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
