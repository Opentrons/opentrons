import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { ComplianceReadySoftwareFiles } from './ComplianceReadySoftwareFiles'
import { DiagnosticsFiles } from './DiagnosticFiles'
import { ProtocolRunRecords } from './ProtocolRunRecords'
import styles from './robotsettingsfilemanager.module.css'
import { RobotStorage } from './RobotStorage'

import type { ReactNode } from 'react'

interface RobotSettingsFileManagerProps {
  robotName: string
}

export function RobotSettingsFileManager({
  robotName,
}: RobotSettingsFileManagerProps): ReactNode {
  const { data: accessControlData } = useAccessControlEnabledQuery()
  const isComplianceReady =
    accessControlData?.data?.accessControlEnabled ?? false

  return (
    <div className={styles.container}>
      <RobotStorage />
      {isComplianceReady ? (
        <ComplianceReadySoftwareFiles robotName={robotName} />
      ) : null}
      <DiagnosticsFiles robotName={robotName} />
      <ProtocolRunRecords robotName={robotName} />
    </div>
  )
}
