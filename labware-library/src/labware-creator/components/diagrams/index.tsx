/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import type { WellBottomShape } from '@opentrons/shared-data'
import type { LabwareType, WellShape } from '../../fields'

interface HeightImgProps {
  labwareType: LabwareType | null | undefined
  aluminumBlockChildType: string | null | undefined
}

export const HeightImg = (props: HeightImgProps): JSX.Element => {
  const { labwareType, aluminumBlockChildType } = props
  let src = require('../../images/height_plate-and-reservoir.svg')
  if (labwareType === 'tubeRack') {
    src = require('../../images/height_tubeRack.svg')
  } else if (labwareType === 'aluminumBlock') {
    // @ts-expect-error(IL, 2021-03-24): `includes` doesn't want to take null/undefined
    if (['tubes', 'pcrTubeStrip'].includes(aluminumBlockChildType)) {
      src = require('../../images/height_aluminumBlock_tubes.svg')
    } else {
      src = require('../../images/height_aluminumBlock_plate.svg')
    }
  }
  return <img src={src} />
}

export const GridImg = (): JSX.Element => {
  const src = require('../../images/grid_row_column.svg')
  return <img src={src} />
}

export const WellXYImg = (props: {
  wellShape: WellShape | null | undefined
}): JSX.Element | null => {
  const { wellShape } = props
  const wellShapeToImg: Record<WellShape, string> = {
    circular: require('../../images/wellXY_circular.svg'),
    rectangular: require('../../images/wellXY_rectangular.svg'),
  }

  if (wellShape != null && wellShape in wellShapeToImg) {
    return <img src={wellShapeToImg[wellShape]} />
  }

  return null
}

export const XYSpacingImg = (props: {
  labwareType: LabwareType | null | undefined
  wellShape: WellShape | null | undefined
  gridRows: string | null | undefined
}): JSX.Element => {
  const { labwareType, wellShape } = props
  const gridRows = Number(props.gridRows)
  // default to this
  let src = require('../../images/spacing_plate_circular.svg')

  if (labwareType === 'reservoir') {
    if (gridRows > 1) {
      src = require('../../images/spacing_reservoir_multirow.svg')
    } else {
      src = require('../../images/spacing_reservoir_1row.svg')
    }
  } else {
    if (wellShape === 'rectangular') {
      src = require('../../images/spacing_plate_rectangular.svg')
    }
  }
  return <img src={src} />
}

interface DepthImgProps {
  labwareType: LabwareType | null | undefined
  wellBottomShape: WellBottomShape | null | undefined
}

export const DepthImg = (props: DepthImgProps): JSX.Element | null => {
  const { labwareType, wellBottomShape } = props
  let src

  if (!wellBottomShape) return null

  if (labwareType === 'reservoir' || labwareType === 'tubeRack') {
    const imgMap = {
      v: require('../../images/depth_reservoir-and-tubes_v.svg'),
      flat: require('../../images/depth_reservoir-and-tubes_flat.svg'),
      u: require('../../images/depth_reservoir-and-tubes_round.svg'),
    }
    src = imgMap[wellBottomShape]
  } else {
    const imgMap = {
      v: require('../../images/depth_plate_v.svg'),
      flat: require('../../images/depth_plate_flat.svg'),
      u: require('../../images/depth_plate_round.svg'),
    }
    src = imgMap[wellBottomShape]
  }

  return <img src={src} />
}

export const XYOffsetImg = (props: {
  labwareType: LabwareType | null | undefined
  wellShape: WellShape | null | undefined
}): JSX.Element => {
  const { labwareType, wellShape } = props
  let src = require('../../images/offset_plate_circular.svg')
  if (labwareType === 'reservoir') {
    src = require('../../images/offset_reservoir.svg')
  } else if (wellShape === 'rectangular') {
    src = require('../../images/offset_plate_rectangular.svg')
  }
  return <img src={src} />
}
