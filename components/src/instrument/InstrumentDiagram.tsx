import * as React from 'react'
import cx from 'classnames'

import singleSrc from './pipetteSingle.png'
import multiSrc from './pipetteMulti.png'
import singleGEN2Src from './pipetteGEN2Single.png'
import multiGEN2Src from './pipetteGEN2Multi.png'
import styles from './instrument.css'

import type { PipetteNameSpecs } from '@opentrons/shared-data'
import type { Mount } from '../robot-types'

export interface InstrumentDiagramProps {
  pipetteSpecs?: Pick<PipetteNameSpecs, 'displayCategory' | 'channels'> | null
  className?: string
  mount: Mount
}

export function InstrumentDiagram(props: InstrumentDiagramProps): JSX.Element {
  const { pipetteSpecs, mount } = props
  const { displayCategory, channels } = pipetteSpecs || {}

  let imgSrc
  switch (displayCategory) {
    case 'GEN2': {
      imgSrc = channels === 1 ? singleGEN2Src : multiGEN2Src
      break
    }
    case 'GEN1':
    default: {
      imgSrc = channels === 1 ? singleSrc : multiSrc
    }
  }
  return (
    <div className={props.className}>
      <img
        className={cx({ [styles.flipped_image]: mount === 'right' })}
        src={imgSrc}
      />
    </div>
  )
}
