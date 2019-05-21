// @flow
import * as React from 'react'

import { LabwareRender, RobotWorkSpace } from '@opentrons/components'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type GalleryProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function Gallery(props: GalleryProps) {
  const { definition, className } = props
  const [currentImage, setCurrentImage] = React.useState(1)

  // TODO(mc, 2019-03-27): use actual images
  const images = [
    <img key="left" src={`https://placekitten.com/480/480`} />,
    <RobotWorkSpace
      key="center"
      viewBox={`0 0 ${definition.dimensions.xDimension} ${
        definition.dimensions.yDimension
      }`}
    >
      {() => <LabwareRender definition={definition} />}
    </RobotWorkSpace>,
    <img key="right" src={`https://placekitten.com/512/512`} />,
  ]

  return (
    <div className={className}>
      <div className={styles.gallery_main}>
        <div className={styles.gallery_image_container}>
          {images[currentImage]}
        </div>
      </div>
      <div className={styles.gallery_thumbnail_row}>
        {images.map((img, index) => (
          <Thumbnail key={index} onClick={() => setCurrentImage(index)}>
            {img}
          </Thumbnail>
        ))}
      </div>
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
