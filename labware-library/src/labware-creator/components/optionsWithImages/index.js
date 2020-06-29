// @flow
import * as React from 'react'

import {
  type Options,
  wellBottomShapeOptions,
  wellShapeOptions,
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

type OptionsWithImages = Array<{|
  name: string,
  value: string,
  children?: React.Node,
|}>

const makeOptionsWithImages = (
  options: Options,
  imageMap: { [value: string]: string }
): OptionsWithImages =>
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

export const wellShapeOptionsWithIcons: OptionsWithImages = makeOptionsWithImages(
  wellShapeOptions,
  WELL_SHAPE_IMAGES
)

export const wellBottomShapeOptionsWithIcons: OptionsWithImages = makeOptionsWithImages(
  wellBottomShapeOptions,
  WELL_BOTTOM_IMAGES
)
