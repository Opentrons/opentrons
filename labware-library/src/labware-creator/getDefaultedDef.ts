import {
  LabwareDefinition2,
  SLOT_LENGTH_MM as DEFAULT_X_DIMENSION,
  SLOT_WIDTH_MM as DEFAULT_Y_DIMENSION,
} from '@opentrons/shared-data'
import cloneDeep from 'lodash/cloneDeep'
import { LabwareFields, ProcessedLabwareFields } from './fields'
import { labwareFormSchema } from './labwareFormSchema'
import { fieldsToLabware } from './fieldsToLabware'

export const getDefaultedDef = (
  _values: LabwareFields
): LabwareDefinition2 | null => {
  const values = cloneDeep(_values)

  // Fill arbitrary values in to any missing fields that aren't needed for this render,
  // eg some required definition data like well volume, height, and bottom shape don't affect the render.
  values.footprintXDimension =
    values.footprintXDimension || `${DEFAULT_X_DIMENSION}`
  values.footprintYDimension =
    values.footprintYDimension || `${DEFAULT_Y_DIMENSION}`
  values.labwareZDimension = values.wellDepth || '100'
  values.wellDepth = values.wellDepth || '80'
  values.wellVolume = values.wellVolume || '50'
  values.wellBottomShape = values.wellBottomShape || 'flat'
  values.labwareType = values.labwareType || 'wellPlate'

  values.displayName = values.displayName || 'Some Labware'
  values.loadName = values.loadName || 'some_labware'
  values.brand = values.brand || 'somebrand'
  // A few other fields don't even go into the definition (eg "is row spacing uniform" etc).
  values.homogeneousWells = 'true'
  values.regularRowSpacing = 'true'
  values.regularColumnSpacing = 'true'
  values.pipetteName = 'whatever'

  let castValues: ProcessedLabwareFields | null = null
  try {
    castValues = labwareFormSchema.cast(values)
    // TODO IMMEDIATELY: if we stick with this instead of single value casting, sniff this error to make sure it's
    // really a Yup validation error (see how Formik does it in `Formik.tsx`).
    // See #7824 and see pattern in formLevelValidation fn
  } catch (error) {}

  if (castValues === null) {
    return null
  }

  let def = null
  if (castValues) {
    def = fieldsToLabware(castValues)
  } else {
    console.log('invalid, no def for getDefaultedDef')
  }
  return def
}
