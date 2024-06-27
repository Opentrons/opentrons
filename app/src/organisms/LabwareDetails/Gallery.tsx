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

export const UNIVERSAL_FLAT_ADAPTER_X_DIMENSION = 127.4

export interface GalleryProps {
  definition: LabwareDefinition
}

export function Gallery(props: GalleryProps): JSX.Element {
  const { definition } = props
  const {
    parameters: params,
    dimensions: dims,
    cornerOffsetFromSlot,
  } = definition
  const xDimension =
    params.loadName === 'opentrons_universal_flat_adapter'
      ? 127.4
      : dims.xDimension

  const [currentImage, setCurrentImage] = React.useState<number>(0)
  const render = (
    <Box width="100%">
      <RobotWorkSpace
        key="center"
        viewBox={`${cornerOffsetFromSlot.x} ${cornerOffsetFromSlot.y} ${xDimension} ${dims.yDimension}`}
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
        <Box data-testid="gallery_main_svg">{images[currentImage]}</Box>
      </Box>
      {images.length > 1 && (
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing16}
          justifyContent={JUSTIFY_SPACE_EVENLY}
        >
          {images.map((img, index) => {
            return (
              <Box
                padding={SPACING.spacing8}
                key={index}
                onClick={() => setCurrentImage(index)}
                data-testid="gallery_mini_image"
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
