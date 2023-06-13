import * as React from 'react'
import cx from 'classnames'
import { Box } from '..'
import singleSrc from '@opentrons/components/src/instrument/single_channel_GEN1_800px.png'
import multiSrc from '@opentrons/components/src/instrument/multi-channel_GEN1_800px.png'
import singleGEN2Src from '@opentrons/components/src/instrument/single-channel_GEN2_800px.png'
import multiGEN2Src from '@opentrons/components/src/instrument/multi-channel_GEN2_800px.png'
import singleFlexSrc from '@opentrons/components/src/instrument/single-channel-gen3.png'
import eightChannelFlexSrc from '@opentrons/components/src/instrument/eight-channel-gen3.png'
import ninetySixSrc from '@opentrons/components/src/instrument/ninety-six-channel-gen1.png'
import styles from './instrument.css'

import type { PipetteNameSpecs } from '@opentrons/shared-data'
import type { Mount } from '../robot-types'
import type { StyleProps } from '..'

export interface InstrumentDiagramProps extends StyleProps {
  pipetteSpecs?: Pick<PipetteNameSpecs, 'displayCategory' | 'channels'> | null
  className?: string
  mount: Mount
}

export function InstrumentDiagram(props: InstrumentDiagramProps): JSX.Element {
  const { pipetteSpecs, mount, className, ...styleProps } = props
  const { displayCategory, channels } = pipetteSpecs || {}

  let imgSrc
  switch (displayCategory) {
    case 'GEN3': {
      imgSrc = channels === 1 ? singleFlexSrc : eightChannelFlexSrc
      break
    }
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
    <Box className={className} {...styleProps}>
      <img
        className={cx({ [styles.flipped_image]: mount === 'right' })}
        src={channels === 96 ? ninetySixSrc : imgSrc}
      />
    </Box>
  )
}
