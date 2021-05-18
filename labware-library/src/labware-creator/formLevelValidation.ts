import { FormikErrors } from 'formik'
import { labwareFormSchemaBaseObject } from './labwareFormSchema'
import type { LabwareFields } from './fields'

export const FORM_LEVEL_ERRORS = 'FORM_LEVEL_ERRORS'
const WELLS_OUT_OF_BOUNDS_X = 'WELLS_OUT_OF_BOUNDS_X'
const WELLS_OUT_OF_BOUNDS_Y = 'WELLS_OUT_OF_BOUNDS_Y'
type FormErrorType = typeof WELLS_OUT_OF_BOUNDS_X | typeof WELLS_OUT_OF_BOUNDS_Y
export type LabwareCreatorErrors = FormikErrors<
  LabwareFields & {
    [FORM_LEVEL_ERRORS]: Partial<Record<FormErrorType, string>>
  }
>

type BoundingBoxFields = {
  gridColumns: number
  gridOffsetX: number
  gridOffsetY: number
  gridRows: number
  gridSpacingX: number
  gridSpacingY: number
} & (
  | { wellDiameter: number }
  | { wellXDimension: number; wellYDimension: number }
)

interface BoundingBoxResult {
  topLeftCornerX: number
  topLeftCornerY: number
  bottomRightCornerX: number
  bottomRightCornerY: number
}

export const getWellGridBoundingBox = (
  args: BoundingBoxFields
): BoundingBoxResult => {
  const {
    gridColumns,
    gridOffsetX,
    gridOffsetY,
    gridRows,
    gridSpacingX,
    gridSpacingY,
  } = args
  if ('wellDiameter' in args) {
    const { wellDiameter } = args
    const r = wellDiameter / 2
    const topLeftCornerX = gridOffsetX - r
    const topLeftCornerY = gridOffsetY - r
    const bottomRightCornerX =
      topLeftCornerX + gridSpacingX * (gridColumns - 1) + wellDiameter
    const bottomRightCornerY =
      topLeftCornerY + gridSpacingY * (gridRows - 1) + wellDiameter
    return {
      topLeftCornerX,
      topLeftCornerY,
      bottomRightCornerX,
      bottomRightCornerY,
    }
  } else {
    const { wellXDimension, wellYDimension } = args
    const topLeftCornerX = gridOffsetX - wellXDimension / 2
    const topLeftCornerY = gridOffsetY - wellYDimension / 2

    const bottomRightCornerX =
      topLeftCornerX + gridSpacingX * (gridColumns - 1) + wellXDimension
    const bottomRightCornerY =
      topLeftCornerY + gridSpacingY * (gridRows - 1) + wellYDimension

    return {
      topLeftCornerX,
      topLeftCornerY,
      bottomRightCornerX,
      bottomRightCornerY,
    }
  }
}

export const formLevelValidation = (
  values: LabwareFields
): LabwareCreatorErrors => {
  // Return value if there are missing fields and partial form casting fails.
  // TODO IMMEDIATELY or add an error just to be safe / grokable?
  // The require fields errors *should* be handled by the required fields errors of those fields, right? So form-level doesn't have to
  // do anything.. ??
  const COULD_NOT_CAST = {}

  // Form-level errors are nested in the FormikErrors object under a special key, FORM_LEVEL_ERRORS.
  const formLevelErrors: Partial<Record<FormErrorType, string>> = {}

  // TODO IMMEDIATELY: right now it's throwing an error if cast fails (even if it's fields we don't care about here)
  // ^ How does the SVG viz's definition work when some fields are missing (eg brand/pipette might be)
  // const castValues = labwareFormSchema.cast(values)
  let castFields:
    | {
        gridColumns: undefined | null | number
        gridOffsetX: undefined | null | number
        gridOffsetY: undefined | null | number
        gridRows: undefined | null | number
        gridSpacingX: undefined | null | number
        gridSpacingY: undefined | null | number
        footprintXDimension: undefined | null | number
        footprintYDimension: undefined | null | number
        wellShape: undefined | null | string
      }
    | undefined
  try {
    castFields = labwareFormSchemaBaseObject
      .pick([
        'footprintXDimension',
        'footprintYDimension',
        'gridColumns',
        'gridOffsetX',
        'gridOffsetY',
        'gridRows',
        'gridSpacingX',
        'gridSpacingY',
        'wellShape',
      ])
      .cast(values)
  } catch (error) {
    // Yup will throw a validation error if validation fails. We catch those and
    // ignore them. We can sniff if something is a Yup error by checking error.name.
    // See https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
    // and https://github.com/formium/formik/blob/2d613c11a67b1c1f5189e21b8d61a9dd8a2d0a2e/packages/formik/src/Formik.tsx
    if (error.name === 'ValidationError' || error.name === 'TypeError') {
      // TODO IMMEDIATELY why are missing values for required fields giving TypeError instead of ValidationError?
      // Is this partial schema (from `pick`) not handing requireds correctly??
      console.log('debug: error was', { error }) // TODO IMMEDIATELY stray log
      return COULD_NOT_CAST
    } else {
      throw error
    }
  }

  if (
    castFields === undefined ||
    castFields.footprintXDimension == null ||
    castFields.footprintYDimension == null ||
    castFields.gridColumns == null ||
    castFields.gridOffsetX == null ||
    castFields.gridOffsetY == null ||
    castFields.gridRows == null ||
    castFields.gridSpacingX == null ||
    castFields.gridSpacingY == null ||
    castFields.wellShape == null
  ) {
    // NOTE: this probably should never be reached,
    console.log('reached 2nd "COULD_NOT_CAST" case!!') // TODO IMMEDIATELY stray log
    return COULD_NOT_CAST
  }
  console.log({ castFields }) // TODO IMMEDIATELY stray log

  const {
    footprintXDimension,
    footprintYDimension,
    gridColumns,
    gridOffsetX,
    gridOffsetY,
    gridRows,
    gridSpacingX,
    gridSpacingY,
    wellShape,
  } = castFields

  let boundingBox: BoundingBoxResult | undefined

  if (wellShape === 'circular') {
    let wellDiameter: number | undefined
    try {
      const castResult = labwareFormSchemaBaseObject
        .pick(['wellDiameter'])
        .cast(values)
      wellDiameter = castResult.wellDiameter
    } catch (error) {
      // Yup will throw a validation error if validation fails. We catch those and
      // ignore them. We can sniff if something is a Yup error by checking error.name.
      // See https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
      // and https://github.com/formium/formik/blob/2d613c11a67b1c1f5189e21b8d61a9dd8a2d0a2e/packages/formik/src/Formik.tsx
      if (error.name === 'ValidationError' || error.name === 'TypeError') {
        // TODO IMMEDIATELY why are missing values for required fields giving TypeError instead of ValidationError?
        // Is this partial schema (from `pick`) not handing requireds correctly??
        console.log('debug: error was', { error }) // TODO IMMEDIATELY stray log
        return COULD_NOT_CAST
      } else {
        throw error
      }
    }
    if (wellDiameter !== undefined) {
      boundingBox = getWellGridBoundingBox({
        gridColumns,
        gridOffsetX,
        gridOffsetY,
        gridRows,
        gridSpacingX,
        gridSpacingY,
        wellDiameter,
      })
    }
  } else if (wellShape === 'rectangular') {
    let wellXDimension: undefined | null | number
    let wellYDimension: undefined | null | number

    try {
      const castResult = labwareFormSchemaBaseObject
        .pick(['wellXDimension', 'wellYDimension'])
        .cast(values)
      wellXDimension = castResult.wellXDimension
      wellYDimension = castResult.wellYDimension
    } catch (error) {
      // Yup will throw a validation error if validation fails. We catch those and
      // ignore them. We can sniff if something is a Yup error by checking error.name.
      // See https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
      // and https://github.com/formium/formik/blob/2d613c11a67b1c1f5189e21b8d61a9dd8a2d0a2e/packages/formik/src/Formik.tsx
      if (error.name === 'ValidationError' || error.name === 'TypeError') {
        // TODO IMMEDIATELY why are missing values for required fields giving TypeError instead of ValidationError?
        // Is this partial schema (from `pick`) not handing requireds correctly??
        console.log('debug: error was', { error }) // TODO IMMEDIATELY stray log
        return COULD_NOT_CAST
      } else {
        throw error
      }
    }

    if (wellXDimension != null && wellYDimension != null) {
      boundingBox = getWellGridBoundingBox({
        gridColumns,
        gridOffsetX,
        gridOffsetY,
        gridRows,
        gridSpacingX,
        gridSpacingY,
        wellXDimension,
        wellYDimension,
      })
    }
  }

  if (boundingBox === undefined) {
    console.log('bounding box undef') // TODO IMMEDIATELY stray log
    return COULD_NOT_CAST
  }

  console.log({ boundingBox })

  // ==================
  // TODO IMMEDIATELY: split the section below out into its own fn, eg getFormLevelFootprintErrors or something

  // TODO IMMEDIATELY: this is only for circle. We need rectangle too! Rect uses wellXDimension, wellYDimension
  // TODO IMMEDIATELY: we probably want a lot of small broken out fns,
  // because for the viewport we want to know the bounding box x0/y0, x1/y1

  const {
    topLeftCornerX,
    topLeftCornerY,
    bottomRightCornerX,
    bottomRightCornerY,
  } = boundingBox

  const wellBoundsInsideFootprintX =
    topLeftCornerX > 0 && bottomRightCornerX < footprintXDimension
  const wellBoundsInsideFootprintY =
    topLeftCornerY > 0 && bottomRightCornerY < footprintYDimension

  // TODO IMMEDIATELY. Eg "tips" or "wells/tubes" maybe??
  // Not sure of copy but I think there's an existing util for this we use
  const labwareName = '--TODO--'

  if (!wellBoundsInsideFootprintX) {
    formLevelErrors[WELLS_OUT_OF_BOUNDS_X] =
      `Grid of ${labwareName} is larger than labware footprint in the X dimension. ` +
      `Please double-check well size, X Spacing, and X Offset.`
  }
  if (!wellBoundsInsideFootprintY) {
    formLevelErrors[WELLS_OUT_OF_BOUNDS_Y] =
      `Grid of ${labwareName} is larger than labware footprint in the Y dimension. ` +
      `Please double-check well size, Y Spacing, and Y Offset.`
  }

  if (Object.keys(formLevelErrors).length > 0) {
    return {
      [FORM_LEVEL_ERRORS]: formLevelErrors,
    }
  } else {
    return {}
  }
}
