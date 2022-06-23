import * as React from 'react'

import {
  Box,
  DIRECTION_ROW,
  DISPLAY_BLOCK,
  Flex,
  JUSTIFY_SPACE_EVENLY,
  LabwareRender,
  RobotWorkSpace,
  SPACING,
  SPACING_AUTO,
} from '@opentrons/components'
import { labwareImages } from './labware-images'

import type { LabwareDefinition } from '../../pages/Labware/types'

export interface GalleryProps {
  definition: LabwareDefinition
}

export function Gallery(props: GalleryProps): JSX.Element {
  const { definition } = props
  const { parameters: params, dimensions: dims } = definition
  const [currentImage, setCurrentImage] = React.useState<number>(0)
  const render = (
    <Box width="100%">
      <RobotWorkSpace
        key="center"
        viewBox={`0 0 ${dims.xDimension} ${dims.yDimension}`}
      >
        {() => <LabwareRender definition={definition} />}
      </RobotWorkSpace>
    </Box>
  )
  const staticImages = labwareImages[params.loadName]?.map((src, index) => (
    <img key={index} src={src} width="100%" />
  ))

  const images = staticImages != null ? [render, ...staticImages] : [render]

  return (
    <Box>
      <Box
        height="224px"
        width="224px"
        display={DISPLAY_BLOCK}
        margin={SPACING_AUTO}
      >
        <Box>{images[currentImage]}</Box>
      </Box>
      {images.length > 1 && (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing4}
          justifyContent={JUSTIFY_SPACE_EVENLY}
        >
          {images.map((img, index) => {
            return (
              <Box
                padding={SPACING.spacing3}
                key={index}
                onClick={() => setCurrentImage(index)}
              >
                <Box width="5rem">{img}</Box>
              </Box>
            )
          })}
        </Flex>
      )}
    </Box>
  )
}
