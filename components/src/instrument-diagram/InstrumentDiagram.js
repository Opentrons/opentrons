// @flow
import React from 'react'
import cx from 'classnames'
import assert from 'assert'
import type { PipetteDisplayCategory } from '@opentrons/shared-data'

import type { Mount } from '../../robot'
import singleSrc from './pipetteSingle.png'
import multiSrc from './pipetteMulti.png'
import singleGEN2Src from './pipetteGEN2Single.png'
import multiGEN2Src from './pipetteGEN2Multi.png'
import styles from './instrument.css'

type Props = {
  channels?: number,
  className?: string,
  mount: Mount,
  displayCategory: PipetteDisplayCategory,
}

export default function InstrumentDiagram(props: Props) {
  const { displayCategory, channels, mount } = props
  assert(
    displayCategory,
    'expected a pipette displayCategory in InstrumentDiagram'
  )

  let imgSrc
  switch (displayCategory) {
    case 'GEN2': {
      imgSrc = channels === 1 ? singleGEN2Src : multiGEN2Src
      break
    }
    default:
    case 'OG': {
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
