// @flow
import React from 'react'
import cx from 'classnames'

import type { Mount } from '../../robot'
import singleSrc from './pipetteSingle.png'
import multiSrc from './pipetteMulti.png'
import singleGEN2Src from './pipetteGEN2Single.png'
import multiGEN2Src from './pipetteGEN2Multi.png'
import styles from './instrument.css'

const PIPETTE_THUMB_MAP = {
  1: {
    single: singleSrc,
    multi: multiSrc,
  },
  2: {
    single: singleGEN2Src,
    multi: multiGEN2Src,
  },
}

type Props = {
  channels?: number,
  className?: string,
  mount: Mount,
  generation: number,
}

export default function InstrumentDiagram(props: Props) {
  const { generation, channels, mount } = props

  return (
    <div className={props.className}>
      <img
        className={cx({ [styles.flipped_image]: mount === 'right' })}
        src={PIPETTE_THUMB_MAP[generation][channels]}
      />
    </div>
  )
}
