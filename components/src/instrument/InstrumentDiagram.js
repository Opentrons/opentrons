// @flow
import * as React from 'react'
import cx from 'classnames'
import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
} from '@opentrons/shared-data'

import type { Mount } from '../robot-types'
import singleSrc from './pipetteSingle.png'
import multiSrc from './pipetteMulti.png'
import singleGEN2Src from './pipetteGEN2Single.png'
import multiGEN2Src from './pipetteGEN2Multi.png'
import styles from './instrument.css'

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
