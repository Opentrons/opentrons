import { LabwareOffsetsTable } from '/app/organisms/LabwareOffsetsTable'

import styles from './setupoffsetstable.module.css'

import type { ProtocolSetupOffsetsProps } from '/app/organisms/ODD/ProtocolSetup'

export function SetupOffsetsTable(
  props: ProtocolSetupOffsetsProps
): JSX.Element {
  return (
    <div className={styles.table_container}>
      <LabwareOffsetsTable {...props} />
    </div>
  )
}
