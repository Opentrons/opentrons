import { Flex } from '../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../styles'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ReactNode } from 'react'
import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { StyleProps } from '..'
import type { Mount } from '../robot-types'

import eightChannelFlexSrc from './eight-channel-flex.png'
import multiSrc from './multi-channel_GEN1_800px.png'
import multiGEN2Src from './multi-channel_GEN2_800px.png'
import ninetySixSrc from './ninety-six-channel-gen1.png'
import singleSrc from './single_channel_GEN1_800px.png'
import singleGEN2Src from './single-channel_GEN2_800px.png'
import singleFlexSrc from './single-channel-flex.png'

export interface InstrumentDiagramProps extends StyleProps {
  mount: Mount
  pipetteSpecs?: Pick<PipetteV2Specs, 'displayCategory' | 'channels'> | null
  className?: string
  imageStyle?: FlattenSimpleInterpolation
}

export function InstrumentDiagram(props: InstrumentDiagramProps): ReactNode {
  const { mount, pipetteSpecs, className, imageStyle, ...styleProps } = props
  const { displayCategory, channels } = pipetteSpecs || {}

  let imgSrc: string
  let altText: string
  switch (displayCategory) {
    case 'FLEX': {
      imgSrc = channels === 1 ? singleFlexSrc : eightChannelFlexSrc
      altText =
        channels === 1
          ? 'Single Channel Flex Pipette'
          : 'Eight Channel Flex Pipette'
      break
    }
    case 'GEN2': {
      imgSrc = channels === 1 ? singleGEN2Src : multiGEN2Src
      altText =
        channels === 1
          ? 'Single Channel GEN2 Pipette'
          : 'Multi Channel GEN2 Pipette'
      break
    }
    case 'GEN1':
    default: {
      imgSrc = channels === 1 ? singleSrc : multiSrc
      altText =
        channels === 1
          ? 'Single Channel GEN1 Pipette'
          : 'Multi Channel GEN1 Pipette'
    }
  }
  return (
    <Flex
      className={className}
      {...styleProps}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <img
        src={channels === 96 ? ninetySixSrc : imgSrc}
        alt={channels === 96 ? '96 Channel Pipette' : altText}
        css={imageStyle}
        height="100%"
      />
    </Flex>
  )
}
