import {
  LabwareDefinition2,
  SLOT_LENGTH_MM as DEFAULT_X_DIMENSION,
  SLOT_WIDTH_MM as DEFAULT_Y_DIMENSION,
} from '@opentrons/shared-data'
import pick from 'lodash/pick'
import { LabwareFields, ProcessedLabwareFields } from './fields'
import { labwareFormSchema } from './labwareFormSchema'
import { fieldsToLabware } from './fieldsToLabware'

// Fill arbitrary values in to any missing fields that aren't needed for this render,
// eg some required definition data like well volume, height, and bottom shape don't affect the render.
//
// The "defaulted def" is also used to calculate multichannel compatibility, which similarly
// only needs XY data and not Z / volume / bottom shape etc.

// This patch should contain any fields that definitely don't affect XY geometry
// for the purposes of the labware render and multichannel compatibility.
export const DEFAULTED_DEF_PATCH: Readonly<Partial<LabwareFields>> = {
  footprintXDimension: `${DEFAULT_X_DIMENSION}`,
  footprintYDimension: `${DEFAULT_Y_DIMENSION}`,
  labwareZDimension: '100',
  wellDepth: '80',
  wellVolume: '50',
  wellBottomShape: 'flat',
  labwareType: 'wellPlate',

  displayName: 'Some Labware',
  loadName: 'some_labware',
  brand: 'somebrand',
  groupBrand: 'somebrand',
  // A few other fields don't even go into the definition (eg "is row spacing uniform" etc).
  homogeneousWells: 'true',
  regularRowSpacing: 'true',
  regularColumnSpacing: 'true',
}

export const getDefaultedDefPatch = (
  values: LabwareFields | null
): Partial<LabwareFields> => {
  const missingKeys = Object.keys(DEFAULTED_DEF_PATCH).filter(
    key => values?.[key as keyof LabwareFields] == null
  ) as Array<keyof LabwareFields>

  return pick(DEFAULTED_DEF_PATCH, missingKeys)
}

export const getDefaultedDef = (
  values: LabwareFields | null
): LabwareDefinition2 | null => {
  const defaultedValues = { ...values, ...getDefaultedDefPatch(values) }
  let castValues: ProcessedLabwareFields | null = null
  try {
    castValues = labwareFormSchema.cast(defaultedValues)
    // TODO(IL, 2021-06-01): if we stick with this instead of single value casting, sniff this error to make sure it's
    // really a Yup validation error (see how Formik does it in `Formik.tsx`).
    // See #7824 and see pattern in formLevelValidation fn
  } catch (error) {
    console.log('getDefaultedDef casting error', error)
  }

  if (castValues === null) {
    return null
  }

  let def = null
  if (castValues) {
    def = fieldsToLabware(castValues)
  } else {
    // TODO(IL, 2021-07-16): is this line unreachable???
    console.log('invalid, no def for getDefaultedDef')
  }
  return def
}
