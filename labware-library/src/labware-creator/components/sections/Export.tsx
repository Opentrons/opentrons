import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import styles from '../../styles.css'

interface ExportProps {
  onExportClick: (e: React.MouseEvent) => unknown
}

export const Export = (props: ExportProps): JSX.Element | null => {
  return (
    <div>
      <div className={styles.export_section} id="DefinitionTest">
        <PrimaryButton
          className={styles.export_button}
          onClick={props.onExportClick}
        >
          EXPORT FILE
        </PrimaryButton>
      </div>
    </div>
  )
}
