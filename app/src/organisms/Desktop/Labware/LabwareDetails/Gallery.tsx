import { useState } from 'react'

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
import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import { labwareImages } from './labware-images'

import type { LabwareDefinition } from '@opentrons/shared-data'

/**
 * opentrons_universal_flat_adapter has a protrusion on one side, but the `dimensions`
 * in the current version of the definition (v1) do not include it. This is a
 * replacement xDimension that includes the protrusion so it doesn't get clipped off
 * when we render an SVG of the adapter.
 */
export const UNIVERSAL_FLAT_ADAPTER_X_DIMENSION = 127.4

export interface GalleryProps {
  definition: LabwareDefinition
}

export function Gallery(props: GalleryProps): JSX.Element {
  const { definition } = props
  const { parameters: params } = definition
  const dims = getSchema2Dimensions(definition)
  const cornerOffsetFromSlot = getSchema2CornerOffsetFromSlot(definition)

  const xDimension =
    params.loadName === 'opentrons_universal_flat_adapter'
      ? UNIVERSAL_FLAT_ADAPTER_X_DIMENSION
      : dims.xDimension

  const [currentImage, setCurrentImage] = useState<number>(0)
  const render = (
    <Box width="100%">
      <RobotWorkSpace
        key="center"
        // TODO BEFORE MERGE
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
    <Box paddingBottom={SPACING.spacing24}>
      <Box
        height="max-content"
        width="14rem"
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
                onClick={() => {
                  setCurrentImage(index)
                }}
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
