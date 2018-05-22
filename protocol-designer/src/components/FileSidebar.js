// @flow
import * as React from 'react'
import {PrimaryButton, OutlineButton, SidePanel} from '@opentrons/components'
import styles from './FileSidebar.css'

type Props = {
  onUpload: (SyntheticInputEvent<HTMLInputElement>) => mixed,
  onCreateNew?: () => mixed,
  downloadData: ?{
    fileContents: string,
    fileName: string
  }
}

export default function FileSidebar (props: Props) {
  return (
    <SidePanel title='Protocol File' className={styles.file_sidebar}>
      {props.downloadData &&
        <div>
          <div className={styles.download_button}>
            <PrimaryButton Component='a' download={props.downloadData.fileName}
              href={'data:application/json;charset=utf-8,' + encodeURIComponent(props.downloadData.fileContents)}
            >Download</PrimaryButton>
          </div>
          <div className={styles.divider} />
        </div>
      }

      <div className={styles.bottom_buttons}>
        <OutlineButton Component='label' className={styles.upload_button}>
          UPLOAD
          <input type='file' onChange={props.onUpload} />
        </OutlineButton>
        <OutlineButton onClick={props.onCreateNew}>Create New</OutlineButton>
      </div>
    </SidePanel>
  )
}
