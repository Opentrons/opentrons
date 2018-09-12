// @flow

import {getPipette} from '@opentrons/shared-data'
import * as React from 'react'
import styles from './NewFileModal.css'
import {InstrumentDiagram} from '@opentrons/components'

function getChannels (pipetteModel: ?string): ?number {
  if (!pipetteModel) return null

  // TODO: Ian 2018-06-27 use getPipette fn from shared-data
  // once PD's pipetteData.js is replaced with shared-data stuff
  const pipetteData = getPipette(pipetteModel)
  return (pipetteData && pipetteData.channels) || null
}

type Props = {
  leftPipette: ?string,
  rightPipette: ?string,
}
export default function PipetteDiagram (props: Props) {
  const {leftPipette, rightPipette} = props
  const leftChannels = getChannels(leftPipette)
  const rightChannels = getChannels(rightPipette)

  return (
    <React.Fragment>
      {(leftPipette && leftChannels)
          ? <InstrumentDiagram
          channels={leftChannels}
          className={styles.left_pipette} />
          : <div className={styles.left_pipette} />
      }
      {(rightPipette && rightChannels)
          ? <InstrumentDiagram
            channels={rightChannels}
            className={styles.right_pipette} />
          : <div className={styles.right_pipette} />
      }
    </React.Fragment>
  )
}
