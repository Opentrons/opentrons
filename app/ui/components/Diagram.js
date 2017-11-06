import React from 'react'
import classnames from 'classnames'

import plateSingleSrc from '../img/labware/plate_single.png'
import troughSingleSrc from '../img/labware/trough_single.png'
import tiprackSingleSrc from '../img/labware/tiprack_single.png'

export default function Diagram (props) {
  const {isTiprack, type} = props
  const style = classnames('flex', 'flex__items_center', 'flex__justify_center')
  let labwareSrc
  if (isTiprack) {
    labwareSrc = tiprackSingleSrc
  } else if (type.includes('trough')) {
    labwareSrc = troughSingleSrc
  } else {
    labwareSrc = plateSingleSrc
  }

  return (
    <div className={style}>
      <img src={labwareSrc} />
    </div>
  )
}
