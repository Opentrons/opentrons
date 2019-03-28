// @flow
import * as React from 'react'

import LabwareRender from '../LabwareRender'
import styles from './styles.css'

import type {LabwareDefinition2 as LabwareDefinition} from '@opentrons/shared-data'

export type GalleryProps = {
  definition: LabwareDefinition,
}

export type GalleryState = {
  currentImage: number,
}

type ThumbnailProps = {
  onClick: () => mixed,
  children: React.Node,
}

class Gallery extends React.Component<GalleryProps, GalleryState> {
  state: GalleryState

  constructor (props: GalleryProps) {
    super(props)
    this.state = {currentImage: 1}
  }

  render () {
    const {definition} = this.props
    const {currentImage} = this.state

    // TODO(mc, 2019-03-27): use actual images
    const images = [
      <img key="left" src={`https://placekitten.com/480/480`} />,
      <LabwareRender key="center" definition={definition} />,
      <img key="right" src={`https://placekitten.com/512/512`} />,
    ]

    return (
      <div className={styles.gallery}>
        <div className={styles.gallery_main}>
          <div className={styles.image_container}>{images[currentImage]}</div>
        </div>
        <div className={styles.thumbnail_row}>
          {images.map((img, index) => (
            <Thumbnail
              key={index}
              imageId={index}
              onClick={() => this.setState({currentImage: index})}
            >
              {img}
            </Thumbnail>
          ))}
        </div>
      </div>
    )
  }
}

function Thumbnail (props: ThumbnailProps) {
  const {onClick, children} = props

  return (
    <button className={styles.thumbnail_container} onClick={onClick}>
      <div className={styles.thumbnail}>
        <div className={styles.image_container}>{children}</div>
      </div>
    </button>
  )
}

export default Gallery
