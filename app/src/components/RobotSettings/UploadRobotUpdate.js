import * as React from 'react'

import { LabeledButton } from '../controls'
import styles from './styles.css'

// TODO (ka 2019-06-13): Add onChange
export default function UploadRobotUpdate() {
  return (
    <LabeledButton
      label="Update robot software from file"
      buttonProps={{
        Component: 'label',
        children: (
          <>
            browse
            <input type="file" onChange={null} className={styles.file_input} />
          </>
        ),
      }}
    >
      <p>
        If your robot cannot access the Internet for updates, upload robot
        software update files here.
      </p>
    </LabeledButton>
  )
}
