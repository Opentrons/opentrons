// @flow
import * as React from 'react'
import {PrimaryButton, OutlineButton, SidePanel} from '@opentrons/components'
import cx from 'classnames'
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
      <OutlineButton Component='label' className={cx(styles.upload_button, styles.bottom_button)}>
        UPLOAD
        <input type='file' onChange={props.onUpload} />
      </OutlineButton>
      <OutlineButton onClick={props.onCreateNew} className={styles.bottom_button}>Create New</OutlineButton>
    </SidePanel>
  )
}
