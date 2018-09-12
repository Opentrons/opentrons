// @flow
import React from 'react'

import singleSrc from './pipetteSingle.png'
import multiSrc from './pipetteMulti.png'

type Props = {
  channels?: number,
  className?: string,
}

export default function InstrumentDiagram (props: Props) {
  const {channels} = props
  const imgSrc = channels === 1
    ? singleSrc
    : multiSrc

  return (
    <div className={props.className}>
      <img src={imgSrc} />
    </div>
  )
}
