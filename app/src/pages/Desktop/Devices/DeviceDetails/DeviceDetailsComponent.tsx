import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { useEstopQuery } from '@opentrons/react-api-client'

import { Divider } from '/app/atoms/structure'
import { EstopBanner } from '/app/organisms/Desktop/Devices/EstopBanner'
import { InputDevices } from '/app/organisms/Desktop/Devices/InputDevices'
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { DeviceDetailsDeckConfiguration } from '/app/organisms/DeviceDetailsDeckConfiguration'
import { DISENGAGED, useEstopContext } from '/app/organisms/EmergencyStop'
import { useIsFlex } from '/app/redux-resources/robots'
import { useFeatureFlag } from '/app/redux/config'

interface DeviceDetailsComponentProps {
  robotName: string
}

export function DeviceDetailsComponent({
  robotName,
}: DeviceDetailsComponentProps): JSX.Element {
  const isFlex = useIsFlex(robotName)
  const isCameraEnabled = useFeatureFlag('camera')
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
        {isCameraEnabled && (
          <>
            <Divider width="100%" />
            <InputDevices isFlex={isFlex} robotName={robotName} />
          </>
        )}
      </Flex>
      {isFlex ? <DeviceDetailsDeckConfiguration robotName={robotName} /> : null}
      <RecentProtocolRuns robotName={robotName} />
    </Box>
  )
}
