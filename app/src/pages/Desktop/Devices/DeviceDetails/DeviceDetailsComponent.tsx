import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { useEstopQuery } from '@opentrons/react-api-client'

import { RoundTab } from '/app/molecules/RoundTab'
import { EstopBanner } from '/app/organisms/Desktop/Devices/EstopBanner'
import { InstrumentsAndModules } from '/app/organisms/Desktop/Devices/InstrumentsAndModules'
import { Peripherals } from '/app/organisms/Desktop/Devices/Peripherals'
import { RecentProtocolRuns } from '/app/organisms/Desktop/Devices/RecentProtocolRuns'
import { RobotOverview } from '/app/organisms/Desktop/Devices/RobotOverview'
import { DeviceDetailsDeckConfiguration } from '/app/organisms/DeviceDetailsDeckConfiguration'
import { DISENGAGED, useEstopContext } from '/app/organisms/EmergencyStop'
import { useIsRobotBusy, useIsRobotViewable } from '/app/redux-resources/robots'

import styles from '../DeviceDetails/devicedetails.module.css'

interface DeviceDetailsComponentProps {
  robotName: string
}

type DeviceDetailsTab = 'hardware' | 'deck-configuration' | 'run-history'

export function DeviceDetailsComponent({
  robotName,
}: DeviceDetailsComponentProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { deviceDetailsTab } = useParams<{
    deviceDetailsTab?: DeviceDetailsTab
  }>()
  const activeTab: DeviceDetailsTab = deviceDetailsTab ?? 'hardware'

  const { data: estopStatus, error: estopError } = useEstopQuery({
    enabled: true,
  })
  const { isEmergencyStopModalDismissed } = useEstopContext()
  const isRobotViewable = useIsRobotViewable(robotName)
  const isRobotBusy = useIsRobotBusy({ poll: true })

  return (
    <div className={styles.device_details_container}>
      {estopStatus?.data.status !== DISENGAGED &&
      estopError == null &&
      isEmergencyStopModalDismissed ? (
        <Flex marginBottom={SPACING.spacing16}>
          <EstopBanner status={estopStatus?.data.status} />
        </Flex>
      ) : null}
      {/* Robot topper card */}
      <Flex
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing16}
        paddingBottom={SPACING.spacing4}
        width="100%"
      >
        <RobotOverview robotName={robotName} />
      </Flex>
      {/* Tab navigation */}
      <div className={styles.tab_group}>
        <RoundTab
          disabled={false}
          end
          to={`/devices/${robotName}`}
          tabName={t('hardware')}
        />
        <RoundTab
          disabled={false}
          tabDisabledReason={t(
            'deck_configuration_is_not_available_when_robot_is_busy'
          )}
          to={`/devices/${robotName}/deck-configuration`}
          tabName={t('deck_configuration_tab')}
        />
        <RoundTab
          disabled={false}
          to={`/devices/${robotName}/run-history`}
          tabName={t('recent_protocol_runs')}
        />
      </div>
      {/* Tab content */}
      {activeTab === 'hardware' && (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <InstrumentsAndModules
            robotName={robotName}
            isRobotViewable={isRobotViewable}
          />
          {isRobotViewable && (
            <Peripherals
              isFlex
              robotName={robotName}
              isRobotBusy={isRobotBusy}
            />
          )}
        </Flex>
      )}
      {activeTab === 'deck-configuration' && (
        <DeviceDetailsDeckConfiguration robotName={robotName} />
      )}
      {activeTab === 'run-history' && (
        <RecentProtocolRuns robotName={robotName} />
      )}
    </div>
  )
}
