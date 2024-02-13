/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import heightPlateAndReservoirImage from '../../images/height_plate-and-reservoir.svg'
import heightTubeRackImage from '../../images/height_tubeRack.svg'
import heightAluminumBlockTubesImage from '../../images/height_aluminumBlock_tubes.svg'
import heightAluminumBlockPlateImage from '../../images/height_aluminumBlock_plate.svg'
import gridRowColumnImage from '../../images/grid_row_column.svg'
import wellXYCircularImage from '../../images/wellXY_circular.svg'
import wellXYRectangularImage from '../../images/wellXY_rectangular.svg'
import spacingPlateCircularImage from '../../images/spacing_plate_circular.svg'
import spacingReservoirMultirowImage from '../../images/spacing_reservoir_multirow.svg'
import spacingReservoirOneRowImage from '../../images/spacing_reservoir_1row.svg'
import spacingPlateRectangularImage from '../../images/spacing_plate_rectangular.svg'
import tipLengthImage from '../../images/tip_length.svg'
import depthReservoirAndTubesVImage from '../../images/depth_reservoir-and-tubes_v.svg'
import depthReservoirAndTubesFlatImage from '../../images/depth_reservoir-and-tubes_flat.svg'
import depthReservoirAndTubesRoundImage from '../../images/depth_reservoir-and-tubes_round.svg'
import depthPlateVImage from '../../images/depth_plate_v.svg'
import depthPlateFlatImage from '../../images/depth_plate_flat.svg'
import depthPlateRoundImage from '../../images/depth_plate_round.svg'
import offsetPlateCircularImage from '../../images/offset_plate_circular.svg'
import offsetPlateReservoirImage from '../../images/offset_reservoir.svg'
import offsetPlateRectangularImage from '../../images/offset_plate_rectangular.svg'
import offsetHelpTextWellsImage from '../../images/offset_helpText_wells.svg'
import offsetHelpTextTubesImage from '../../images/offset_helpText_tubes.svg'
import offsetHelpTextTipsImage from '../../images/offset_helpText_tips.svg'

import type { WellBottomShape } from '@opentrons/shared-data'
import type { LabwareType, WellShape } from '../../fields'



interface HeightImgProps {
  labwareType: LabwareType | null | undefined
  aluminumBlockChildType: string | null | undefined
}

export const HeightImg = (props: HeightImgProps): JSX.Element => {
  const { labwareType, aluminumBlockChildType } = props
  let src = heightPlateAndReservoirImage
  let alt = 'plate or reservoir height'
  if (labwareType === 'tubeRack') {
    src = heightTubeRackImage
    alt = 'tube rack height'
  } else if (labwareType === 'aluminumBlock') {
    // @ts-expect-error(IL, 2021-03-24): `includes` doesn't want to take null/undefined
    if (['tubes', 'pcrTubeStrip'].includes(aluminumBlockChildType)) {
      src = heightAluminumBlockTubesImage
      alt = 'alumninum block with tubes height'
    } else {
      src = heightAluminumBlockPlateImage
      alt = 'alumninum block with plate height'
    }
  }
  return <img src={src} alt={alt} />
}

export const GridImg = (): JSX.Element => {
  const src = gridRowColumnImage
  return <img src={src} alt="grid rows and columns" />
}

export const WellXYImg = (props: {
  wellShape: WellShape | null | undefined
}): JSX.Element | null => {
  const { wellShape } = props
  const wellShapeToImg: Record<WellShape, string> = {
    circular: wellXYCircularImage,
    rectangular: wellXYRectangularImage,
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
  let src = spacingPlateCircularImage
  let alt = 'circular well spacing'
  if (labwareType === 'reservoir') {
    if (gridRows > 1) {
      src = spacingReservoirMultirowImage
      alt = 'multi row reservoir spacing'
    } else {
      src = spacingReservoirOneRowImage
      alt = 'singular row reservoir spacing'
    }
  } else {
    if (wellShape === 'rectangular') {
      src = spacingPlateRectangularImage
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
    src = tipLengthImage
    alt = 'tip length'
  }
  if (!!wellBottomShape) {
    if (labwareType === 'reservoir' || labwareType === 'tubeRack') {
      const imgMap = {
        v: depthReservoirAndTubesVImage,
        flat: depthReservoirAndTubesFlatImage,
        u: depthReservoirAndTubesRoundImage,
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
        v: depthPlateVImage,
        flat: depthPlateFlatImage,
        u: depthPlateRoundImage, 
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
  let src = offsetPlateCircularImage
  let alt = 'circular well offset'
  if (labwareType === 'reservoir') {
    src = offsetPlateReservoirImage
    alt = 'reservoir well offset'
  } else if (wellShape === 'rectangular') {
    src = offsetPlateRectangularImage
    alt = 'rectangular well offset'
  }
  return <img src={src} alt={alt} />
}

export const XYOffsetHelperTextImg = (props: {
  labwareType: LabwareType | null | undefined
}): JSX.Element => {
  const { labwareType } = props
  let src = offsetHelpTextWellsImage
  let alt = 'well grid offset'
  // NOTE (ka 2021-6-8): this case is not needed till custom tuberacks but adding logic/image in here
  // This section is hidden with opentrons tubracks/alumn blocks at the moment since we know the grid offset already
  if (labwareType === 'tubeRack') {
    src = offsetHelpTextTubesImage
    alt = 'tube grid offset'
  } else if (labwareType === 'tipRack') {
    src = offsetHelpTextTipsImage
    alt = 'tip grid offset'
  }
  return <img src={src} alt={alt} />
}
