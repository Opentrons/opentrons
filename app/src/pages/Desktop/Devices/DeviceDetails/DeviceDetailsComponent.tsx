import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { Peripherals } from '/app/organisms/Desktop/Devices/Peripherals'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { DeviceDetailsDeckConfiguration } from '/app/organisms/DeviceDetailsDeckConfiguration'
import { DISENGAGED, useEstopContext } from '/app/organisms/EmergencyStop'
import { useIsFlex, useIsRobotViewable } from '/app/redux-resources/robots'

interface DeviceDetailsComponentProps {
  robotName: string
}

export function DeviceDetailsComponent({
  robotName,
}: DeviceDetailsComponentProps): JSX.Element {
  const location = useLocation()
  const isFlex = useIsFlex(robotName)
  const { data: estopStatus, error: estopError } = useEstopQuery({
    enabled: isFlex,
  })
  const { isEmergencyStopModalDismissed } = useEstopContext()
  const isRobotViewable = useIsRobotViewable(robotName)

  // If we are explicitly redirected to an anchor link on this page,
  // scroll to it.
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [location])

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
        <InstrumentsAndModules
          robotName={robotName}
          isRobotViewable={isRobotViewable}
        />
        {isRobotViewable && (
          <>
            <Divider width="100%" />
            <Peripherals isFlex={isFlex} robotName={robotName} />
          </>
        )}
      </Flex>
      {isFlex ? <DeviceDetailsDeckConfiguration robotName={robotName} /> : null}
      <Flex id="recent-protocol-runs">
        <RecentProtocolRuns robotName={robotName} />
      </Flex>
    </Box>
  )
}
