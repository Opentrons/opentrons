import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { ComplianceReadySoftwareFiles } from './ComplianceReadySoftwareFiles'
import { ProtocolRunRecords } from './ProtocolRunRecords'
import styles from './robotsettingsfilemanager.module.css'
import { RobotStorage } from './RobotStorage'

export function RobotSettingsFileManager(): JSX.Element {
  const { data: accessControlData } = useAccessControlEnabledQuery()
  const isComplianceReady =
    accessControlData?.data?.accessControlEnabled ?? false

  return (
    <div className={styles.container}>
      <RobotStorage />
      {isComplianceReady ? <ComplianceReadySoftwareFiles /> : null}
      <ProtocolRunRecords />
    </div>
  )
}
