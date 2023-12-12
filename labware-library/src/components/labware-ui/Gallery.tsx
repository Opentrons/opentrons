import * as React from 'react'

import { LabwareRender, RobotWorkSpace } from '@opentrons/components'
import { labwareImages } from './labware-images'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export interface GalleryProps {
  definition: LabwareDefinition
  className?: string
}

export function Gallery(props: GalleryProps): JSX.Element {
  const { definition, className } = props
  const {
    parameters: params,
    dimensions: dims,
    cornerOffsetFromSlot,
  } = definition
  const [currentImage, setCurrentImage] = React.useState(0)
  const render = (
    <RobotWorkSpace
      key="center"
      viewBox={`${cornerOffsetFromSlot.x} ${cornerOffsetFromSlot.y} ${dims.xDimension} ${dims.yDimension}`}
      width="100%"
      height="100%"
    >
      {() => <LabwareRender definition={definition} />}
    </RobotWorkSpace>
  )

  const staticImages = (
    labwareImages[params.loadName] || []
  ).map((src, key) => <img key={key} src={src} />)

  const images = [...staticImages, render]

  return (
    <div className={className}>
      <div className={styles.gallery_main}>
        <div className={styles.gallery_image_container}>
          {images[currentImage]}
        </div>
      </div>
      {images.length > 1 && (
        <div className={styles.gallery_thumbnail_row}>
          {images.map((img, index) => (
            <Thumbnail key={index} onClick={() => setCurrentImage(index)}>
              {img}
            </Thumbnail>
          ))}
        </div>
      )}
    </div>
  )
}

interface ThumbnailProps {
  onClick: () => unknown
  children: React.ReactNode
}

function Thumbnail(props: ThumbnailProps): JSX.Element {
  const { onClick, children } = props

  return (
    <button className={styles.gallery_thumbnail_container} onClick={onClick}>
      <div className={styles.gallery_thumbnail}>
        <div className={styles.gallery_image_container}>{children}</div>
      </div>
    </button>
  )
}
