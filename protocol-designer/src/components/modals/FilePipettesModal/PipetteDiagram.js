// @flow

import { getPipetteNameSpecs } from '@opentrons/shared-data'
import * as React from 'react'
import styles from './FilePipettesModal.css'
import { InstrumentDiagram } from '@opentrons/components'

function getChannels(pipetteName: ?string): ?number {
  if (!pipetteName) return null

  const pipetteData = getPipetteNameSpecs(pipetteName)
  return (pipetteData && pipetteData.channels) || null
}

type Props = {
  leftPipette: ?string,
  rightPipette: ?string,
}
export default function PipetteDiagram(props: Props) {
  const { leftPipette, rightPipette } = props
  const leftSpecs = getPipetteNameSpecs(leftPipette)
  const rightSpecs = getPipetteNameSpecs(rightPipette)

  return (
    <React.Fragment>
      {leftPipette && leftSpecs ? (
        <InstrumentDiagram
          channels={leftSpecs.channels}
          className={styles.left_pipette}
        />
      ) : (
        <div className={styles.left_pipette} />
      )}
      {rightPipette && rightSpecs ? (
        <InstrumentDiagram
          channels={rightSpecs.channels}
          className={styles.right_pipette}
        />
      ) : (
        <div className={styles.right_pipette} />
      )}
    </React.Fragment>
  )
}
