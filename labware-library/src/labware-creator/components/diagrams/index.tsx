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
  let alt = 'plate or reservoir height'
  if (labwareType === 'tubeRack') {
    src = require('../../images/height_tubeRack.svg')
    alt = 'tube rack height'
  } else if (labwareType === 'aluminumBlock') {
    // @ts-expect-error(IL, 2021-03-24): `includes` doesn't want to take null/undefined
    if (['tubes', 'pcrTubeStrip'].includes(aluminumBlockChildType)) {
      src = require('../../images/height_aluminumBlock_tubes.svg')
      alt = 'alumninum block with tubes height'
    } else {
      src = require('../../images/height_aluminumBlock_plate.svg')
      alt = 'alumninum block with plate height'
    }
  }
  return <img src={src} alt={alt} />
}

export const GridImg = (): JSX.Element => {
  const src = require('../../images/grid_row_column.svg')
  return <img src={src} alt="grid rows and columns" />
}

export const WellXYImg = (props: {
  wellShape: WellShape | null | undefined
}): JSX.Element | null => {
  const { wellShape } = props
  const wellShapeToImg: Record<WellShape, string> = {
    circular: require('../../images/wellXY_circular.svg'),
    rectangular: require('../../images/wellXY_rectangular.svg'),
  }

  const wellShapeToAlt: Record<WellShape, string> = {
    circular: 'circular well diameter',
    rectangular: 'rectangluar well XY',
  }

  if (wellShape != null && wellShape in wellShapeToImg) {
    return (
      <img src={wellShapeToImg[wellShape]} alt={wellShapeToAlt[wellShape]} />
    )
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
  let alt = 'circular well spacing'
  if (labwareType === 'reservoir') {
    if (gridRows > 1) {
      src = require('../../images/spacing_reservoir_multirow.svg')
      alt = 'multi row reservoir spacing'
    } else {
      src = require('../../images/spacing_reservoir_1row.svg')
      alt = 'singular row reservoir spacing'
    }
  } else {
    if (wellShape === 'rectangular') {
      src = require('../../images/spacing_plate_rectangular.svg')
      alt = 'rectangular well spacing'
    }
  }
  return <img src={src} alt={alt} />
}

interface DepthImgProps {
  labwareType: LabwareType | null | undefined
  wellBottomShape: WellBottomShape | null | undefined
}

export const DepthImg = (props: DepthImgProps): JSX.Element | null => {
  const { labwareType, wellBottomShape } = props
  let src
  let alt

  if (labwareType === 'tipRack') {
    src = require('../../images/tip_length.svg')
    alt = 'tip length'
  }
  if (!!wellBottomShape) {
    if (labwareType === 'reservoir' || labwareType === 'tubeRack') {
      const imgMap = {
        v: require('../../images/depth_reservoir-and-tubes_v.svg'),
        flat: require('../../images/depth_reservoir-and-tubes_flat.svg'),
        u: require('../../images/depth_reservoir-and-tubes_round.svg'),
      }
      const altMap = {
        v: 'v shaped reservoir or tube rack depth',
        flat: 'flat bottom reservoir or tube rack depth',
        u: 'u shaped reservoir or tube rack depth',
      }
      src = imgMap[wellBottomShape]
      alt = altMap[wellBottomShape]
    } else {
      const imgMap = {
        v: require('../../images/depth_plate_v.svg'),
        flat: require('../../images/depth_plate_flat.svg'),
        u: require('../../images/depth_plate_round.svg'),
      }
      const altMap = {
        v: 'v shaped well depth',
        flat: 'flat bottom well depth',
        u: 'u shaped well depth',
      }
      src = imgMap[wellBottomShape]
      alt = altMap[wellBottomShape]
    }
  }

  return <img src={src} alt={alt} />
}

export const XYOffsetImg = (props: {
  labwareType: LabwareType | null | undefined
  wellShape: WellShape | null | undefined
}): JSX.Element => {
  const { labwareType, wellShape } = props
  let src = require('../../images/offset_plate_circular.svg')
  let alt = 'circular well offset'
  if (labwareType === 'reservoir') {
    src = require('../../images/offset_reservoir.svg')
    alt = 'reservoir well offset'
  } else if (wellShape === 'rectangular') {
    src = require('../../images/offset_plate_rectangular.svg')
    alt = 'rectangular well offset'
  }
  return <img src={src} alt={alt} />
}

export const XYOffsetHelperTextImg = (props: {
  labwareType: LabwareType | null | undefined
}): JSX.Element => {
  const { labwareType } = props
  let src = require('../../images/offset_helpText_wells.svg')
  let alt = 'well grid offset'
  // NOTE (ka 2021-6-8): this case is not needed till custom tuberacks but adding logic/image in here
  // This section is hidden with opentrons tubracks/alumn blocks at the moment since we know the grid offset already
  if (labwareType === 'tubeRack') {
    src = require('../../images/offset_helpText_tubes.svg')
    alt = 'tube grid offset'
  } else if (labwareType === 'tipRack') {
    src = require('../../images/offset_helpText_tips.svg')
    alt = 'tip grid offset'
  }
  return <img src={src} alt={alt} />
}
