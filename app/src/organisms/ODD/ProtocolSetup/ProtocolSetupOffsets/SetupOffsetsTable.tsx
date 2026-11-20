import { LabwareOffsetsTable } from '/app/organisms/LabwareOffsetsTable'

import styles from './setupoffsetstable.module.css'

import type { ReactNode } from 'react'
import type { ProtocolSetupOffsetsProps } from '/app/organisms/ODD/ProtocolSetup'

export function SetupOffsetsTable(props: ProtocolSetupOffsetsProps): ReactNode {
  return (
    <div className={styles.table_container}>
      <LabwareOffsetsTable {...props} />
    </div>
  )
}
