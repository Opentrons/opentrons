import React from 'react'
import classnames from 'classnames'

import plateSingleSrc from '../img/labware/plate_single.png'
import tiprackSingleSrc from '../img/labware/tiprack_single.png'

export default function Diagram (props) {
  const {isTiprack} = props
  const style = classnames('flex', 'flex__items_center', 'flex__justify_center')
  const labwareSrc = isTiprack
    ? tiprackSingleSrc
    : plateSingleSrc
  return (
    <div className={style}>
      <img src={labwareSrc} />
    </div>
  )
}
