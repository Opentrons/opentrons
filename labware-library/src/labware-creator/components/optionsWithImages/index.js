// @flow
import * as React from 'react'
import {
  wellBottomShapeOptions,
  wellShapeOptions,
  type Options,
} from '../../fields'
import styles from './optionsWithImages.css'

const WELL_SHAPE_IMAGES = {
  rectangular: require('../../../images/rectangularWell.svg'),
  circular: require('../../../images/circularWell.svg'),
}

const WELL_BOTTOM_IMAGES = {
  flat: require('../../../images/wellShapeFlat.svg'),
  u: require('../../../images/wellShapeU.svg'),
  v: require('../../../images/wellShapeV.svg'),
}

const makeOptionsWithImages = (
  options: Options,
  imageMap: { [value: string]: string }
): Array<{| name: string, value: string, children?: React.Node |}> =>
  options.map(opt => ({
    name: opt.name,
    value: opt.value,
    children: (
      <div className={styles.radio_image_label}>
        <img className={styles.radio_image} src={imageMap[opt.value]} />
        <div>{opt.name}</div>
      </div>
    ),
  }))

export const wellShapeOptionsWithIcons = makeOptionsWithImages(
  wellShapeOptions,
  WELL_SHAPE_IMAGES
)

export const wellBottomShapeOptionsWithIcons = makeOptionsWithImages(
  wellBottomShapeOptions,
  WELL_BOTTOM_IMAGES
)
