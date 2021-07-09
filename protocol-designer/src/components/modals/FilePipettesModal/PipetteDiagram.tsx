import * as React from 'react'
import cx from 'classnames'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { InstrumentDiagram } from '@opentrons/components'
import { FormPipette } from '../../../step-forms/types'
import styles from './FilePipettesModal.css'

interface Props {
  leftPipette?: FormPipette['pipetteName']
  rightPipette?: FormPipette['pipetteName']
}

export function PipetteDiagram(props: Props): JSX.Element {
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

function PipetteGroup(props: Props): JSX.Element {
  const { leftPipette, rightPipette } = props
  // @ts-expect-error(sa, 2021-6-21): getPipetteNameSpecs expects actual pipette names aka PipetteName, type narrow first
  const leftSpecs = leftPipette && getPipetteNameSpecs(leftPipette)
  // @ts-expect-error(sa, 2021-6-21): getPipetteNameSpecs expects actual pipette names aka PipetteName, type narrow first
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
