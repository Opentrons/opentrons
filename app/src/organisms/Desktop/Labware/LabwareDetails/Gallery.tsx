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
import { getLabwareViewBox, labwareImages } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
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

export function Gallery(props: GalleryProps): ReactNode {
  const { definition } = props
  const { parameters: params } = definition

  const { minX, minY, xDimension, yDimension } = getLabwareViewBox(definition)
  const xDimensionOverride = [
    'opentrons_universal_flat_adapter',
    'opentrons_universal_flat_adapter_type_b',
  ].includes(params.loadName)
    ? UNIVERSAL_FLAT_ADAPTER_X_DIMENSION
    : xDimension

  const [currentImage, setCurrentImage] = useState<number>(0)
  const render = (
    <Box width="100%">
      <RobotWorkSpace
        key="center"
        viewBox={`${minX} ${minY} ${xDimensionOverride} ${yDimension}`}
      >
        {() => (
          <LabwareRender
            definition={definition}
            positioningMode="passThrough"
          />
        )}
      </RobotWorkSpace>
    </Box>
  )
  const staticImages = labwareImages[params.loadName]?.map((src, index) => (
    <img
      key={index}
      src={src}
      width="100%"
      alt={`Image of ${params.loadName}`}
    />
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
