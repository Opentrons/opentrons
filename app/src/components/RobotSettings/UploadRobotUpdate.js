// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { LabeledButton } from '@opentrons/components'
import { startBuildrootUpdate } from '../../buildroot'
import styles from './styles.css'

import type { Dispatch } from '../../types'

export type UploadRobotUpdateProps = {|
  robotName: string,
|}

export function UploadRobotUpdate(props: UploadRobotUpdateProps) {
  const { robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (files.length === 1) {
      // NOTE: File.path is Electron-specific
      // https://electronjs.org/docs/api/file-object
      dispatch(startBuildrootUpdate(robotName, (files[0]: any).path))
    }
    // clear input value to allow same file to be selected again if necessary
    event.target.value = ''
  }

  return (
    <LabeledButton
      label="Update robot software from file"
      buttonProps={{
        Component: 'label',
        children: (
          <>
            browse
            <input
              type="file"
              className={styles.file_input}
              onChange={handleChange}
            />
          </>
        ),
      }}
    >
      <p>
        If your app is unable to auto-download robot updates, you can download
        the robot update yourself and update your robot manually
      </p>
    </LabeledButton>
  )
}
