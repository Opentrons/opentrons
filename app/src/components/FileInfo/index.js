// @flow
import * as React from 'react'

// TODO(mc, 2018-09-13): these aren't cards; rename
import InformationCard from './InformationCard'
import ProtocolPipettesCard from './ProtocolPipettesCard'
import ProtocolModulesCard from './ProtocolModulesCard'
import ProtocolLabwareCard from './ProtocolLabwareCard'
import Continue from './Continue'
import UploadError from '../UploadError'
import styles from './styles.css'

import type { Robot } from '../../discovery'

const NO_STEPS_MESSAGE = `This protocol has no steps in it - there's nothing for your robot to do! Your protocol needs at least one aspirate/dispense to import properly`

type Props = {|
  robot: Robot,
  sessionLoaded: boolean,
  sessionHasSteps: boolean,
  uploadError: ?{ message: string },
|}

export default function FileInfo(props: Props) {
  const { robot, sessionLoaded, sessionHasSteps } = props
  let uploadError = props.uploadError

  if (sessionLoaded && !uploadError && !sessionHasSteps) {
    uploadError = { message: NO_STEPS_MESSAGE }
  }

  return (
    <div className={styles.file_info_container}>
      <InformationCard />
      <ProtocolPipettesCard robot={robot} />
      <ProtocolModulesCard robot={robot} />
      <ProtocolLabwareCard />
      {uploadError && <UploadError uploadError={uploadError} />}
      {sessionLoaded && !uploadError && <Continue />}
    </div>
  )
}
