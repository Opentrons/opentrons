// @flow
import * as React from 'react'

import type {Robot} from '../../robot'

// TODO(mc, 2018-09-13): these aren't cards; rename
import InformationCard from './InformationCard'
import ProtocolPipettesCard from './ProtocolPipettesCard'
import ProtocolModulesCard from './ProtocolModulesCard'
import ProtocolLabwareCard from './ProtocolLabwareCard'
import Continue from './Continue'
import UploadError from '../UploadError'

import styles from './styles.css'

type Props = {
  robot: Robot,
  sessionLoaded: ?boolean,
  uploadError: ?{message: string},
}

export default function FileInfo (props: Props) {
  const {robot, sessionLoaded, uploadError} = props

  return (
    <div className={styles.file_info_container}>
      <InformationCard />
      <ProtocolPipettesCard robot={robot} />
      <ProtocolModulesCard robot={robot} />
      <ProtocolLabwareCard />
      {uploadError && <UploadError uploadError={uploadError} />}
      {sessionLoaded && <Continue />}
    </div>
  )
}
