// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  PrimaryButton,
  OutlineButton,
  SidePanel,
} from '@opentrons/components'
import styles from './FileSidebar.css'

type Props = {
  loadFile: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  createNewFile?: () => mixed,
  downloadData: ?{
    fileContents: string,
    fileName: string,
  },
  onDownload: (event: SyntheticEvent<*>) => mixed,
}

export default function FileSidebar (props: Props) {
  const {downloadData, loadFile, createNewFile, onDownload} = props
  return (
    <SidePanel title='Protocol File'>
      <div className={styles.file_sidebar}>
        <OutlineButton onClick={createNewFile} className={styles.button}>
          Create New
        </OutlineButton>

        <OutlineButton Component='label' className={cx(styles.upload_button)}>
          Import
          <input type='file' onChange={loadFile} />
        </OutlineButton>

        <div className={styles.button}>
          <PrimaryButton
            Component='a'
            download={downloadData && downloadData.fileName}
            onClick={onDownload}
            disabled={!downloadData}
            href={downloadData && 'data:application/json;charset=utf-8,' + encodeURIComponent(downloadData.fileContents)}
          >Export</PrimaryButton>
        </div>
      </div>
    </SidePanel>
  )
}
