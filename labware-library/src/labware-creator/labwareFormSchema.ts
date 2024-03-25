import * as Yup from 'yup'
import { getAllLoadNames, getAllDisplayNames } from '../definitions'
import { getDefaultLoadName, getDefaultDisplayName } from './formSelectors'
import {
  labwareTypeOptions,
  wellBottomShapeOptions,
  wellShapeOptions,
  DEFAULT_RACK_BRAND,
  IRREGULAR_LABWARE_ERROR,
  LABWARE_TOO_SMALL_ERROR,
  LABWARE_TOO_LARGE_ERROR,
  LABELS,
  LOOSE_TIP_FIT_ERROR,
  MAX_X_DIMENSION,
  MAX_Y_DIMENSION,
  MAX_Z_DIMENSION,
  MIN_X_DIMENSION,
  MIN_Y_DIMENSION,
  REQUIRED_FIELD_ERROR,
  MUST_BE_A_NUMBER_ERROR,
  LabwareFields,
} from './fields'
import type { ProcessedLabwareFields } from './fields'

// global overrides for Yup's default error messages.
Yup.setLocale({
  mixed: {
    required: REQUIRED_FIELD_ERROR,
  },
})

const ALL_DISPLAY_NAMES = new Set(
  getAllDisplayNames().map(n => n.toLowerCase().trim())
)
const requiredString = (label: string): Yup.StringSchema =>
  Yup.string().label(label).typeError(REQUIRED_FIELD_ERROR).required()

// put this in a transform to make Yup to show "this field is required"
// instead of "must be a number". See https://github.com/jquense/yup/issues/971
const nanToUndefined = (value: number): number | undefined =>
  isNaN(value) ? undefined : value

const requiredPositiveNumber = (label: string): Yup.NumberSchema =>
  Yup.number()
    .label(label)
    .transform(nanToUndefined)
    .typeError(MUST_BE_A_NUMBER_ERROR)
    .moreThan(0)
    .required()

const requiredPositiveInteger = (label: string): Yup.NumberSchema =>
  Yup.number()
    .transform(nanToUndefined)
    .label(label)
    .typeError(MUST_BE_A_NUMBER_ERROR)
    .moreThan(0)
    .integer()
    .required()

const unsupportedLabwareIfFalse = (label: string): Yup.BooleanSchema =>
  Yup.boolean()
    .default(false)
    .label(label)
    .typeError(REQUIRED_FIELD_ERROR)
    .oneOf([true], IRREGULAR_LABWARE_ERROR)
    .required()

const nameExistsError = (nameName: string): string =>
  `This ${nameName} already exists in the Opentrons default labware library. Please edit the ${nameName} to make it unique.`

// NOTE: all IRREGULAR_LABWARE_ERROR messages will be converted to a special 'error' Alert

// NOTE: same as getIsCustomTubeRack util, but different args type
const matchCustomTubeRack = (
  labwareType: LabwareFields['labwareType'],
  tubeRackInsertLoadName: LabwareFields['tubeRackInsertLoadName']
): boolean =>
  labwareType === 'tubeRack' && tubeRackInsertLoadName === 'customTubeRack'

// NOTE: same as getIsOpentronsTubeRack util, but different args type
const matchOpentronsTubeRack = (
  labwareType: LabwareFields['labwareType'],
  tubeRackInsertLoadName: LabwareFields['tubeRackInsertLoadName']
): boolean =>
  labwareType === 'tubeRack' && tubeRackInsertLoadName !== 'customTubeRack'

export const labwareFormSchemaBaseObject = Yup.object({
  labwareType: requiredString(LABELS.labwareType).oneOf(
    labwareTypeOptions.map(o => o.value)
  ),
  tubeRackInsertLoadName: Yup.mixed().when('labwareType', {
    is: 'tubeRack',
    then: requiredString(LABELS.tubeRackInsertLoadName),
    otherwise: Yup.mixed().nullable(),
  }),
  // TODO(mc, 2020-06-02): should this be Yup.string() instead of mixed?
  aluminumBlockType: Yup.mixed().when('labwareType', {
    is: 'aluminumBlock',
    then: requiredString(LABELS.aluminumBlockType),
    otherwise: Yup.mixed().nullable(),
  }),
  // TODO(mc, 2020-06-02): should this be Yup.string() instead of mixed?
  aluminumBlockChildType: Yup.mixed().when(
    ['labwareType', 'aluminumBlockType'],
    {
      // only required for 96-well aluminum block
      is: (labwareType: string, aluminumBlockType: string): boolean =>
        labwareType === 'aluminumBlock' && aluminumBlockType === '96well',
      then: requiredString(LABELS.aluminumBlockChildType),
      otherwise: Yup.mixed().nullable(),
    }
  ),

  handPlacedTipFit: Yup.string().when('labwareType', {
    is: 'tipRack',
    then: requiredString(LABELS.handPlacedTipFit).oneOf(
      ['snug'],
      LOOSE_TIP_FIT_ERROR
    ),
    otherwise: Yup.string().nullable(),
  }),

  // tubeRackSides: Array<string>
  footprintXDimension: Yup.number()
    .transform(nanToUndefined)
    .label(LABELS.footprintXDimension)
    .typeError(MUST_BE_A_NUMBER_ERROR)
    .min(MIN_X_DIMENSION, LABWARE_TOO_SMALL_ERROR)
    .max(MAX_X_DIMENSION, LABWARE_TOO_LARGE_ERROR)
    .nullable()
    .required(),
  footprintYDimension: Yup.number()
    .transform(nanToUndefined)
    .label(LABELS.footprintYDimension)
    .typeError(MUST_BE_A_NUMBER_ERROR)
    .min(MIN_Y_DIMENSION, LABWARE_TOO_SMALL_ERROR)
    .max(MAX_Y_DIMENSION, LABWARE_TOO_LARGE_ERROR)
    .nullable()
    .required(),
  labwareZDimension: requiredPositiveNumber(LABELS.labwareZDimension).max(
    MAX_Z_DIMENSION,
    IRREGULAR_LABWARE_ERROR
  ),

  gridRows: requiredPositiveInteger(LABELS.gridRows),
  gridColumns: requiredPositiveInteger(LABELS.gridColumns),
  // TODO(mc, 2020-06-02): should this be number() instead of mixed?
  gridSpacingX: Yup.mixed().when('gridColumns', {
    is: 1,
    then: Yup.mixed().default(0),
    otherwise: requiredPositiveNumber(LABELS.gridSpacingX),
  }),
  // TODO(mc, 2020-06-02): should this be number() instead of mixed()?
  gridSpacingY: Yup.mixed().when('gridRows', {
    is: 1,
    then: Yup.mixed().default(0),
    otherwise: requiredPositiveNumber(LABELS.gridSpacingY),
  }),
  gridOffsetX: requiredPositiveNumber(LABELS.gridOffsetX),
  gridOffsetY: requiredPositiveNumber(LABELS.gridOffsetY),
  homogeneousWells: unsupportedLabwareIfFalse(LABELS.homogeneousWells),
  regularRowSpacing: Yup.mixed().when('gridRows', {
    is: 1,
    then: Yup.mixed().default(true),
    otherwise: unsupportedLabwareIfFalse(LABELS.regularRowSpacing),
  }),
  regularColumnSpacing: Yup.mixed().when('gridColumns', {
    is: 1,
    then: Yup.mixed().default(true),
    otherwise: unsupportedLabwareIfFalse(LABELS.regularColumnSpacing),
  }),

  wellVolume: requiredPositiveNumber(LABELS.wellVolume),
  wellBottomShape: Yup.string().when('labwareType', {
    is: 'tipRack',
    then: Yup.string().nullable(),
    otherwise: requiredString(LABELS.wellBottomShape).oneOf(
      wellBottomShapeOptions.map(o => o.value)
    ),
  }),
  wellDepth: Yup.number().when('labwareType', {
    is: 'tipRack',
    then: Yup.number()
      .transform(nanToUndefined)
      .label('Length')
      .typeError(MUST_BE_A_NUMBER_ERROR)
      .moreThan(0)
      .max(
        Yup.ref('labwareZDimension'),
        'Tip Length cannot exceed labware height'
      )
      .required(),
    otherwise: Yup.number()
      .transform(nanToUndefined)
      .label(LABELS.wellDepth)
      .typeError(MUST_BE_A_NUMBER_ERROR)
      .moreThan(0)
      .max(
        Yup.ref('labwareZDimension'),
        'Well depth cannot exceed labware height'
      )
      .required(),
  }),
  wellShape: requiredString(LABELS.wellShape).oneOf(
    wellShapeOptions.map(o => o.value)
  ),

  // used with circular well shape only
  wellDiameter: Yup.mixed().when('wellShape', {
    is: 'circular',
    then: requiredPositiveNumber(LABELS.wellDiameter),
    otherwise: Yup.mixed().nullable(),
  }),

  // used with rectangular well shape only
  wellXDimension: Yup.mixed().when('wellShape', {
    is: 'rectangular',
    then: requiredPositiveNumber(LABELS.wellXDimension),
    otherwise: Yup.mixed().nullable(),
  }),
  wellYDimension: Yup.mixed().when('wellShape', {
    is: 'rectangular',
    then: requiredPositiveNumber(LABELS.wellYDimension),
    otherwise: Yup.mixed().nullable(),
  }),
  // non-custom tuberacks (aka Opentrons tube racks) default to "Opentrons" brand,
  // and user cannot see or override brand (aka "rack brand")
  brand: Yup.mixed().when(['labwareType', 'tubeRackInsertLoadName'], {
    is: matchOpentronsTubeRack,
    then: Yup.mixed().nullable(), // defaulted to DEFAULT_RACK_BRAND in form-level transform below
    otherwise: requiredString(LABELS.brand),
  }),
  // TODO(mc, 2020-06-02): should this be Yup.array() instead of mixed?
  brandId: Yup.mixed()
    .nullable()
    .transform(
      (
        currentValue: string | null | undefined,
        originalValue: string | null | undefined
      ): ProcessedLabwareFields['brandId'] =>
        (currentValue || '')
          .trim()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
    ),
  // group brand (aka "tube brand") is only required for custom tube racks
  groupBrand: Yup.mixed().when(['labwareType', 'tubeRackInsertLoadName'], {
    is: matchCustomTubeRack,
    then: requiredString(LABELS.groupBrand),
    otherwise: Yup.mixed().nullable(),
  }),
  // TODO(mc, 2020-06-02): should this be Yup.array() instead of mixed?
  groupBrandId: Yup.mixed()
    .nullable()
    .transform(
      (
        currentValue: string | null | undefined,
        originalValue: string | null | undefined
      ): ProcessedLabwareFields['groupBrandId'] =>
        (currentValue || '')
          .trim()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
    ),

  loadName: Yup.string()
    .nullable()
    .label(LABELS.loadName)
    .notOneOf(getAllLoadNames(), nameExistsError('load name'))
    .matches(
      /^[a-z0-9._]+$/,
      '${label} can only contain lowercase letters, numbers, dot (.) and underscore (_). Spaces are not allowed.' // eslint-disable-line no-template-curly-in-string
    ),
  // TODO(mc, 2020-06-02): should this be Yup.string() instead of mixed?
  displayName: Yup.mixed()
    .nullable()
    .label(LABELS.displayName)
    .test(
      'displayNameDoesNotAlreadyExist',
      nameExistsError('display name'),
      (value: string | null | undefined) =>
        !ALL_DISPLAY_NAMES.has(
          (value == null ? '' : value).toLowerCase().trim()
        ) // case-insensitive and trim-insensitive match
    )
    .transform(
      (
        currentValue: string | null | undefined,
        originalValue: string | null | undefined
      ) => (currentValue == null ? currentValue : currentValue.trim())
    ),
})

// @ts-expect-error(IL, 2021-03-25): something(s) about this schema don't match the flow type (labwareType: string problem??)
export const labwareFormSchema: Yup.Schema<ProcessedLabwareFields> = labwareFormSchemaBaseObject.transform(
  (currentValue, originalValue) => {
    // "form-level" transforms
    // NOTE: the currentValue does NOT have field-level transforms applied :(
    // TODO: these results are not validated, ideally I could do these transforms in the fields

    // Yup runs transforms before defaults. In order for brand defaulting to work for displayName/loadName
    // creation, we can't do .default() to the brand field, but need to default it here.
    const brand = matchOpentronsTubeRack(
      currentValue.labwareType,
      currentValue.tubeRackInsertLoadName
    )
      ? DEFAULT_RACK_BRAND
      : currentValue.brand

    const nextValues = { ...currentValue, brand }

    const displayName =
      currentValue.displayName == null || currentValue.displayName.trim() === ''
        ? getDefaultDisplayName(nextValues)
        : currentValue.displayName

    const loadName = currentValue.loadName || getDefaultLoadName(nextValues)

    return {
      ...currentValue,
      brand,
      loadName,
      displayName,
    }
  }
)
