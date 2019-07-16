// @flow
import React from 'react'
import cx from 'classnames'
import assert from 'assert'

import type { Mount } from '../../robot'
import singleSrc from './pipetteSingle.png'
import multiSrc from './pipetteMulti.png'
import singleGEN2Src from './pipetteGEN2Single.png'
import multiGEN2Src from './pipetteGEN2Multi.png'
import styles from './instrument.css'

const getPipetteThumb = ({
  generation,
  channels,
}: {
  generation: number,
  channels: number,
}) => {
  assert(generation, 'expected generation')
  switch (generation) {
    case 1:
      return channels === 1 ? singleSrc : multiSrc
    case 2:
      return channels === 1 ? singleGEN2Src : multiGEN2Src
    default:
      return singleSrc
  }
}

type Props = {
  channels?: number,
  className?: string,
  mount: Mount,
  generation: number,
}

export default function InstrumentDiagram(props: Props) {
  const { generation, channels, mount } = props
  assert(generation, 'expected a pipette generation in InstrumentDiagram')

  let imgSrc
  switch (generation) {
    case 1: {
      imgSrc = channels === 1 ? singleSrc : multiSrc
      break
    }
    case 2: {
      imgSrc = channels === 1 ? singleGEN2Src : multiGEN2Src
      break
    }
    default: {
      imgSrc = singleSrc
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
