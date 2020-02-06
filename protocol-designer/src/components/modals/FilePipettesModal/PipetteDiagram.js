// @flow

import { getPipetteNameSpecs } from '@opentrons/shared-data'
import * as React from 'react'
import styles from './FilePipettesModal.css'
import { InstrumentDiagram } from '@opentrons/components'

type Props = {
  leftPipette: ?string,
  rightPipette: ?string,
}
export default function PipetteDiagram(props: Props) {
  const { leftPipette, rightPipette } = props
  const leftSpecs = leftPipette && getPipetteNameSpecs(leftPipette)
  const rightSpecs = rightPipette && getPipetteNameSpecs(rightPipette)

  return (
    <React.Fragment>
      {leftPipette && leftSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={leftSpecs}
          className={styles.left_pipette}
          mount="left"
        />
      ) : (
        <div className={styles.left_pipette} />
      )}
      {rightPipette && rightSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={rightSpecs}
          className={styles.right_pipette}
          mount="right"
        />
      ) : (
        <div className={styles.right_pipette} />
      )}
    </React.Fragment>
  )
}
