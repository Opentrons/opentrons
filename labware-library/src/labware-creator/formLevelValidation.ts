import { FormikErrors } from 'formik'
import { labwareFormSchemaBaseObject } from './labwareFormSchema'
import type { LabwareFields } from './fields'
import { getLabwareName } from './utils'

export const FORM_LEVEL_ERRORS = 'FORM_LEVEL_ERRORS'
export const WELLS_OUT_OF_BOUNDS_X = 'WELLS_OUT_OF_BOUNDS_X'
export const WELLS_OUT_OF_BOUNDS_Y = 'WELLS_OUT_OF_BOUNDS_Y'
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

const partialCast = <TKey extends keyof LabwareFields>(
  values: LabwareFields,
  keys: TKey[]
): Pick<
  ReturnType<typeof labwareFormSchemaBaseObject['cast']>,
  TKey
> | null => {
  const partialSchema = labwareFormSchemaBaseObject.pick(keys)
  let castFields: ReturnType<typeof partialSchema['cast']> | null = null
  try {
    castFields = partialSchema.cast(values)
  } catch (error) {
    // Yup will throw a validation error if validation fails. We catch those and
    // ignore them. We can sniff if something is a Yup error by checking error.name.
    // See https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
    // and https://github.com/formium/formik/blob/2d613c11a67b1c1f5189e21b8d61a9dd8a2d0a2e/packages/formik/src/Formik.tsx
    if (
      error instanceof Error &&
      error.name !== 'ValidationError' &&
      error.name !== 'TypeError'
    ) {
      // TODO(IL, 2021-05-19): why are missing values for required fields giving TypeError instead of ValidationError?
      // Is this partial schema (from `pick`) not handing requireds correctly??
      throw error
    }
  }
  return castFields
}

export const formLevelValidation = (
  values: LabwareFields
): LabwareCreatorErrors => {
  // NOTE(IL, 2021-05-27): Casting will fail when any of the fields in a partial cast are missing values and don't have
  // Yup casting defaults via `default()`. This happens very commonly, eg when users haven't gotten down to fill out
  // any of these castFields yet in a new labware. When casting fails, formLevelValidation returns no errors (empty obj)
  // and does not block save. This seems safe to do for now bc currently all these fields are required, at least in
  // combination with each other (eg, wellDiameter is required only if wellShape is 'circular'). So we don't need
  // form-level errors to block save in the case that some fields are missing, bc we can rely on the field-level
  // errors from Yup validation. BUT - if we ever break this pattern and use purely-optional fields in this
  // formLevelValidation fn in the future, we might need to return form-level errors when certain partial casting
  // operations fail. We'll see!

  // Return value if there are missing fields and partial form casting fails.
  const COULD_NOT_CAST = {}

  // Form-level errors are nested in the FormikErrors object under a special key, FORM_LEVEL_ERRORS.
  const formLevelErrors: Partial<Record<FormErrorType, string>> = {}

  const castFields = partialCast(values, [
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

  if (
    castFields == null ||
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
    return COULD_NOT_CAST
  }

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
    const castResult = partialCast(values, ['wellDiameter'])
    if (castResult?.wellDiameter != null) {
      const { wellDiameter } = castResult
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
    const castResult = partialCast(values, ['wellXDimension', 'wellYDimension'])
    if (
      castResult?.wellXDimension != null &&
      castResult?.wellYDimension != null
    ) {
      boundingBox = getWellGridBoundingBox({
        gridColumns,
        gridOffsetX,
        gridOffsetY,
        gridRows,
        gridSpacingX,
        gridSpacingY,
        wellXDimension: castResult.wellXDimension,
        wellYDimension: castResult.wellYDimension,
      })
    }
  }

  if (boundingBox === undefined) {
    return COULD_NOT_CAST
  }

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

  const labwareName = getLabwareName(values, true)

  if (!wellBoundsInsideFootprintX) {
    formLevelErrors[WELLS_OUT_OF_BOUNDS_X] =
      `Grid of ${labwareName} is larger than labware footprint in the X dimension. ` +
      `Please double check well size, X Spacing, and X Offset.`
  }
  if (!wellBoundsInsideFootprintY) {
    formLevelErrors[WELLS_OUT_OF_BOUNDS_Y] =
      `Grid of ${labwareName} is larger than labware footprint in the Y dimension. ` +
      `Please double check well size, Y Spacing, and Y Offset.`
  }

  if (Object.keys(formLevelErrors).length > 0) {
    return {
      [FORM_LEVEL_ERRORS]: formLevelErrors,
    }
  } else {
    return {}
  }
}
