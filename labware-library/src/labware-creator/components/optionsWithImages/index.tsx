import * as React from 'react'
import { wellBottomShapeOptions, wellShapeOptions } from '../../fields'
import type { Options } from '../../fields'
import styles from './optionsWithImages.module.css'

const WELL_SHAPE_IMAGES = {
  rectangular: new URL('../../../images/rectangularWell.svg', import.meta.url)
    .href,
  circular: new URL('../../../images/circularWell.svg', import.meta.url).href,
}

const WELL_BOTTOM_IMAGES = {
  flat: new URL('../../../images/wellShapeFlat.svg', import.meta.url).href,
  u: new URL('../../../images/wellShapeU.svg', import.meta.url).href,
  v: new URL('../../../images/wellShapeV.svg', import.meta.url).href,
}

interface ImageOption {
  name: string
  value: string
  children?: React.ReactNode
}

type OptionsWithImages = ImageOption[]

const makeOptionsWithImages = (
  options: Options,
  imageMap: Record<string, string>
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
