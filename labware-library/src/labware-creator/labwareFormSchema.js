// @flow
import * as Yup from 'yup'
import { getAllLoadNames, getAllDisplayNames } from '../definitions'
import { getDefaultLoadName, getDefaultDisplayName } from './formSelectors'
import {
  labwareTypeOptions,
  wellBottomShapeOptions,
  wellShapeOptions,
  IRREGULAR_LABWARE_ERROR,
  LABELS,
  MAX_X_DIMENSION,
  MIN_X_DIMENSION,
  MAX_Y_DIMENSION,
  MIN_Y_DIMENSION,
  MAX_Z_DIMENSION,
  type ProcessedLabwareFields,
} from './fields'

const ALL_DISPLAY_NAMES = new Set(
  getAllDisplayNames().map(n => n.toLowerCase().trim())
)

const REQUIRED_FIELD = '${label} is required' // eslint-disable-line no-template-curly-in-string
const requiredString = (label: string) =>
  Yup.string()
    .label(label)
    .typeError(REQUIRED_FIELD)
    .required()
const MUST_BE_A_NUMBER = '${label} must be a number' // eslint-disable-line no-template-curly-in-string

const requiredPositiveNumber = (label: string) =>
  Yup.number()
    .label(label)
    .typeError(MUST_BE_A_NUMBER)
    .moreThan(0)
    .required()

const requiredPositiveInteger = (label: string) =>
  Yup.number()
    .label(label)
    .typeError(MUST_BE_A_NUMBER)
    .moreThan(0)
    .integer()
    .required()

const unsupportedLabwareIfFalse = (label: string) =>
  Yup.boolean()
    .label(label)
    .typeError(REQUIRED_FIELD)
    .oneOf([true], IRREGULAR_LABWARE_ERROR)
    .required()

const nameExistsError = (nameName: string) =>
  `This ${nameName} already exists in the Opentrons default labware library. Please edit the ${nameName} to make it unique.`

// NOTE: all IRREGULAR_LABWARE_ERROR messages will be converted to a special 'error' Alert
export const labwareFormSchema = Yup.object()
  .shape({
    labwareType: requiredString(LABELS.labwareType).oneOf(
      labwareTypeOptions.map(o => o.value)
    ),
    tubeRackInsertLoadName: Yup.mixed().when('labwareType', {
      is: 'tubeRack',
      then: requiredString(LABELS.tubeRackInsertLoadName),
      otherwise: Yup.mixed().nullable(),
    }),
    aluminumBlockType: Yup.mixed().when('labwareType', {
      is: 'aluminumBlock',
      then: requiredString(LABELS.aluminumBlockType),
      otherwise: Yup.mixed().nullable(),
    }),
    aluminumBlockChildType: Yup.mixed().when(
      ['labwareType', 'aluminumBlockType'],
      {
        // only required for 96-well aluminum block
        is: (labwareType, aluminumBlockType) =>
          labwareType === 'aluminumBlock' && aluminumBlockType === '96well',
        then: requiredString(LABELS.aluminumBlockChildType),
        otherwise: Yup.mixed().nullable(),
      }
    ),

    // tubeRackSides: Array<string>
    footprintXDimension: Yup.number()
      .label(LABELS.footprintXDimension)
      .typeError(MUST_BE_A_NUMBER)
      .min(MIN_X_DIMENSION, IRREGULAR_LABWARE_ERROR)
      .max(MAX_X_DIMENSION, IRREGULAR_LABWARE_ERROR)
      .required(),
    footprintYDimension: Yup.number()
      .label(LABELS.footprintYDimension)
      .typeError(MUST_BE_A_NUMBER)
      .min(MIN_Y_DIMENSION, IRREGULAR_LABWARE_ERROR)
      .max(MAX_Y_DIMENSION, IRREGULAR_LABWARE_ERROR)
      .required(),
    labwareZDimension: requiredPositiveNumber(LABELS.labwareZDimension).max(
      MAX_Z_DIMENSION,
      IRREGULAR_LABWARE_ERROR
    ),

    gridRows: requiredPositiveInteger(LABELS.gridRows),
    gridColumns: requiredPositiveInteger(LABELS.gridColumns),
    gridSpacingX: Yup.mixed().when('gridColumns', {
      is: 1,
      then: Yup.mixed().default(0),
      otherwise: requiredPositiveNumber(LABELS.gridSpacingX),
    }),
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
    wellBottomShape: requiredString(LABELS.wellBottomShape).oneOf(
      wellBottomShapeOptions.map(o => o.value)
    ),
    wellDepth: Yup.number()
      .label(LABELS.wellDepth)
      .typeError(MUST_BE_A_NUMBER)
      .moreThan(0)
      .max(
        Yup.ref('labwareZDimension'),
        'Well depth cannot exceed labware height'
      )
      .required(),
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

    brand: requiredString(LABELS.brand),
    brandId: Yup.mixed()
      .nullable()
      .transform((currentValue: ?string, originalValue: ?string): $PropertyType<
        ProcessedLabwareFields,
        'brandId'
      > =>
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
    displayName: Yup.mixed()
      .nullable()
      .label(LABELS.displayName)
      .test(
        'displayNameDoesNotAlreadyExist',
        nameExistsError('display name'),
        (value: ?string) =>
          !ALL_DISPLAY_NAMES.has(
            (value == null ? '' : value).toLowerCase().trim()
          ) // case-insensitive and trim-insensitive match
      )
      .transform((currentValue: ?string, originalValue: ?string) =>
        currentValue == null ? currentValue : currentValue.trim()
      ),
    pipetteName: requiredString(LABELS.pipetteName),
  })
  .transform((currentValue, originalValue) => {
    // "form-level" transforms
    // NOTE: the currentValue does NOT have transforms applied :(
    // TODO: these results are not validated, ideally I could do these transforms in the fields
    const displayName =
      currentValue.displayName == null || currentValue.displayName.trim() === ''
        ? getDefaultDisplayName(currentValue)
        : currentValue.displayName

    const loadName = currentValue.loadName || getDefaultLoadName(currentValue)

    return {
      ...currentValue,
      loadName,
      displayName,
    }
  })
