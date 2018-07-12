// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  PrimaryButton,
  OutlineButton,
  SidePanel
} from '@opentrons/components'
import styles from './FileSidebar.css'

type Props = {
  loadFile: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  createNewFile?: () => mixed,
  downloadData: ?{
    fileContents: string,
    fileName: string
  }
}

export default function FileSidebar (props: Props) {
  const {downloadData, loadFile, createNewFile} = props
  return (
    <SidePanel title='Protocol File' className={styles.file_sidebar}>
      <div>
        <div className={styles.download_button}>
          <PrimaryButton
            Component='a'
            download={downloadData && downloadData.fileName}
            disabled={!downloadData}
            href={downloadData && 'data:application/json;charset=utf-8,' + encodeURIComponent(downloadData.fileContents)}
          >Export</PrimaryButton>
        </div>
        <div className={styles.divider} />
      </div>

      <OutlineButton Component='label' className={cx(styles.upload_button, styles.bottom_button)}>
        Import JSON
        <input type='file' onChange={loadFile} />
      </OutlineButton>

      <OutlineButton onClick={createNewFile} className={styles.bottom_button}>
        Create New
      </OutlineButton>
    </SidePanel>
  )
}
