// @flow

import { InstrumentDiagram } from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'

import styles from './FilePipettesModal.css'

type Props = {
  leftPipette: ?string,
  rightPipette: ?string,
}
export function PipetteDiagram(props: Props): React.Node {
  const { leftPipette, rightPipette } = props

  // TODO (ka 2020-4-16): This is temporaray until FF is removed.
  // Gross but neccessary for removing the wrapper div when FF is off.
  return (
    <>
      <div className={cx(styles.mount_diagram)}>
        <PipetteGroup leftPipette={leftPipette} rightPipette={rightPipette} />
      </div>
    </>
  )
}

function PipetteGroup(props: Props) {
  const { leftPipette, rightPipette } = props
  const leftSpecs = leftPipette && getPipetteNameSpecs(leftPipette)
  const rightSpecs = rightPipette && getPipetteNameSpecs(rightPipette)
  return (
    <>
      {leftPipette && leftSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={leftSpecs}
          className={styles.left_pipette}
          mount="left"
        />
      ) : (
        <div className={styles.left_pipette} />
      )}{' '}
      {rightPipette && rightSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={rightSpecs}
          className={styles.right_pipette}
          mount="right"
        />
      ) : (
        <div className={styles.right_pipette} />
      )}
    </>
  )
}
