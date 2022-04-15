import * as React from 'react'
import cx from 'classnames'

import singleSrc from '@opentrons/components/src/instrument/single_channel_GEN1_800px.png'
import multiSrc from '@opentrons/components/src/instrument/multi-channel_GEN1_800px.png'
import singleGEN2Src from '@opentrons/components/src/instrument/single-channel_GEN2_800px.png'
import multiGEN2Src from '@opentrons/components/src/instrument/multi-channel_GEN2_800px.png'
import styles from './instrument.css'

import type { PipetteNameSpecs } from '@opentrons/shared-data'
import type { Mount } from '../robot-types'
import type { FlattenSimpleInterpolation } from 'styled-components'

export interface InstrumentDiagramProps {
  pipetteSpecs?: Pick<PipetteNameSpecs, 'displayCategory' | 'channels'> | null
  className?: string
  css?: FlattenSimpleInterpolation
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
    <div className={props.className} css={props.css}>
      <img
        className={cx({ [styles.flipped_image]: mount === 'right' })}
        src={imgSrc}
      />
    </div>
  )
}
