// @flow
import type {
  PipetteModelSpecs,
  PipetteNameSpecs,
} from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'

import type { Mount } from '../robot-types'
import styles from './instrument.css'
import multiGEN2Src from './pipetteGEN2Multi.png'
import singleGEN2Src from './pipetteGEN2Single.png'
import multiSrc from './pipetteMulti.png'
import singleSrc from './pipetteSingle.png'

export type InstrumentDiagramProps = {|
  pipetteSpecs?: PipetteNameSpecs | PipetteModelSpecs | null,
  className?: string,
  mount: Mount,
|}

export function InstrumentDiagram(props: InstrumentDiagramProps): React.Node {
  const { pipetteSpecs, mount } = props
  const { displayCategory, channels } = pipetteSpecs || {}

  let imgSrc
  switch (displayCategory) {
    case 'GEN2': {
      imgSrc = channels === 1 ? singleGEN2Src : multiGEN2Src
      break
    }
    default:
    case 'GEN1': {
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
