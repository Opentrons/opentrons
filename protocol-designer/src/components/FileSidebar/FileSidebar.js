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
  canDownload: boolean,
  onDownload: (event: SyntheticEvent<*>) => mixed,
}

export default function FileSidebar (props: Props) {
  const {canDownload, loadFile, createNewFile, onDownload} = props
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
          <PrimaryButton onClick={onDownload} disabled={!canDownload}>
            Export
          </PrimaryButton>
        </div>
      </div>
    </SidePanel>
  )
}
