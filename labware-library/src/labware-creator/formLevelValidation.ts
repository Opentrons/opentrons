import { FormikErrors } from 'formik'
import { labwareFormSchemaBaseObject } from './labwareFormSchema'
import type { LabwareFields } from './fields'

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

const getLabwareName = (values: LabwareFields): string => {
  const { labwareType } = values
  switch (labwareType) {
    case 'tipRack':
      return 'tips'
    case 'tubeRack':
      return 'tubes'
    case 'wellPlate':
    case 'aluminumBlock':
    case 'reservoir':
    default:
      return 'wells'
  }
}

// pick<TKey extends keyof TShape>(keys: TKey[]): OptionalObjectSchema<
//   Pick<TShape, TKey>,
//   TContext,
//   TypeOfShape<Pick<TShape, TKey>>
//   | Optionals<TIn>
// >;

// TShape extends ObjectShape, TContext extends AnyObject = AnyObject, TIn extends Maybe<TypeOfShape<TShape>>
// = TypeOfShape<TShape>> extends ObjectSchema<TShape, TContext, TIn> {

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
    if (error.name !== 'ValidationError' && error.name !== 'TypeError') {
      // TODO IMMEDIATELY why are missing values for required fields giving TypeError instead of ValidationError?
      // Is this partial schema (from `pick`) not handing requireds correctly??
      throw error
    }
  }
  return castFields
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

  const labwareName = getLabwareName(values)

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
