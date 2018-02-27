// @flow
import React from 'react'
import {PrimaryButton, OutlineButton, SidePanel} from '@opentrons/components'
import styles from './FileSidebar.css'

type Props = {
  onUploadClick?: () => mixed,
  onDownloadClick?: () => mixed,
  onCreateNew?: () => mixed
}

export default function FileSidebar (props: Props) {
  return (
    <SidePanel title='Protocol File' className={styles.file_sidebar}>
      {props.onDownloadClick &&
        <div>
          <div className={styles.download_button}>
            <PrimaryButton onClick={props.onDownloadClick}>Download</PrimaryButton>
          </div>
          <div className={styles.divider} />
        </div>
      }

      <div className={styles.bottom_buttons}>
        <OutlineButton onClick={props.onUploadClick}>Upload</OutlineButton>
        <OutlineButton onClick={props.onCreateNew}>Create New</OutlineButton>
      </div>
    </SidePanel>
  )
}
