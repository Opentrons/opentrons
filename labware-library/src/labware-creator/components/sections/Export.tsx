import type * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import styles from '../../styles.module.css'

interface ExportProps {
  onExportClick: (e: React.MouseEvent) => unknown
  isOnRunApp: boolean
  disabled: boolean
}

export const Export = (props: ExportProps): JSX.Element | null => {
  return props.isOnRunApp ? (
    <PrimaryButton onClick={props.onExportClick} disabled={props.disabled}>
      {'Save'}
    </PrimaryButton>
  ) : (
    <div className={styles.export_section} id="DefinitionTest">
      <PrimaryButton
        className={styles.export_button}
        onClick={props.onExportClick}
        disabled={props.disabled}
      >
        {'EXPORT FILE'}
      </PrimaryButton>
    </div>
  )
}
