import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { ComplianceReadySoftwareFiles } from './ComplianceReadySoftwareFiles'
import { DiagnosticsFiles } from './DiagnosticFiles'
import { ProtocolRunRecords } from './ProtocolRunRecords'
import styles from './robotsettingsfilemanager.module.css'
import { RobotStorage } from './RobotStorage'

interface RobotSettingsFileManagerProps {
  robotName: string
}

export function RobotSettingsFileManager({
  robotName,
}: RobotSettingsFileManagerProps): JSX.Element {
  const { data: accessControlData } = useAccessControlEnabledQuery()
  const isComplianceReady =
    accessControlData?.data?.accessControlEnabled ?? false

  return (
    <div className={styles.container}>
      <RobotStorage />
      <DiagnosticsFiles robotName={robotName} />
      {isComplianceReady ? <ComplianceReadySoftwareFiles /> : null}
      <ProtocolRunRecords />
    </div>
  )
}
