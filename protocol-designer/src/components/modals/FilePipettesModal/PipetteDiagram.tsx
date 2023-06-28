import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import cx from 'classnames'
import {
  FLEX_ROBOT_TYPE,
  getPipetteNameSpecs,
  PipetteName,
} from '@opentrons/shared-data'
import { InstrumentDiagram } from '@opentrons/components'
import { FormPipette } from '../../../step-forms/types'
import { getRobotType } from '../../../file-data/selectors'
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
    <div className={cx(styles.mount_diagram)}>
      <PipetteGroup leftPipette={leftPipette} rightPipette={rightPipette} />
    </div>
  )
}

function PipetteGroup(props: Props): JSX.Element {
  const { leftPipette, rightPipette } = props
  const robotType = useSelector(getRobotType)
  const leftSpecs =
    leftPipette && getPipetteNameSpecs(leftPipette as PipetteName)
  const rightSpecs =
    rightPipette && getPipetteNameSpecs(rightPipette as PipetteName)
  return (
    <>
      {leftPipette && leftSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={leftSpecs}
          className={styles.left_pipette}
          mount="left"
          imageStyle={
            robotType === FLEX_ROBOT_TYPE
              ? css`
                  left: 36rem;
                  position: fixed;
                `
              : undefined
          }
        />
      ) : (
        <div className={styles.left_pipette} />
      )}
      {rightPipette && rightSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={rightSpecs}
          className={styles.right_pipette}
          mount="right"
          imageStyle={
            robotType === FLEX_ROBOT_TYPE
              ? css`
                  right: -2rem;
                  position: fixed;
                `
              : undefined
          }
        />
      ) : (
        <div className={styles.right_pipette} />
      )}
    </>
  )
}
