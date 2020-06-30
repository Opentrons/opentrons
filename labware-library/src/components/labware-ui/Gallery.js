// @flow
import * as React from 'react'

import { LabwareRender, RobotWorkSpace } from '@opentrons/components'
import type { LabwareDefinition } from '../../types'
import { labwareImages } from './labware-images'
import styles from './styles.css'

export type GalleryProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function Gallery(props: GalleryProps): React.Node {
  const { definition, className } = props
  const { parameters: params, dimensions: dims } = definition
  const [currentImage, setCurrentImage] = React.useState(0)
  const render = (
    <RobotWorkSpace
      key="center"
      viewBox={`0 0 ${dims.xDimension} ${dims.yDimension}`}
      className={styles.robot_workspace}
    >
      {() => <LabwareRender definition={definition} />}
    </RobotWorkSpace>
  )

  const staticImages = (labwareImages[params.loadName] || []).map(
    (src, key) => <img key={key} src={src} />
  )

  const images = [render, ...staticImages]

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

type ThumbnailProps = {|
  onClick: () => mixed,
  children: React.Node,
|}

function Thumbnail(props: ThumbnailProps) {
  const { onClick, children } = props

  return (
    <button className={styles.gallery_thumbnail_container} onClick={onClick}>
      <div className={styles.gallery_thumbnail}>
        <div className={styles.gallery_image_container}>{children}</div>
      </div>
    </button>
  )
}
