// @flow
import * as Yup from 'yup'
import { getAllLoadNames } from '../definitions'
import {
  labwareTypeOptions,
  wellBottomShapeOptions,
  wellShapeOptions,
  IRREGULAR_LABWARE_ERROR,
  LABELS,
  X_DIMENSION,
  Y_DIMENSION,
  XY_ALLOWED_VARIANCE,
  MAX_Z_DIMENSION,
} from './fields'

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

// NOTE: all IRREGULAR_LABWARE_ERROR messages will be converted to a special 'error' Alert
const labwareFormSchema = Yup.object().shape({
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
    .min(X_DIMENSION - XY_ALLOWED_VARIANCE, IRREGULAR_LABWARE_ERROR)
    .max(X_DIMENSION + XY_ALLOWED_VARIANCE, IRREGULAR_LABWARE_ERROR)
    .required(),
  footprintYDimension: Yup.number()
    .label(LABELS.footprintYDimension)
    .typeError(MUST_BE_A_NUMBER)
    .min(Y_DIMENSION - XY_ALLOWED_VARIANCE, IRREGULAR_LABWARE_ERROR)
    .max(Y_DIMENSION + XY_ALLOWED_VARIANCE, IRREGULAR_LABWARE_ERROR)
    .required(),
  labwareZDimension: requiredPositiveNumber(LABELS.labwareZDimension).max(
    MAX_Z_DIMENSION,
    IRREGULAR_LABWARE_ERROR
  ),

  gridRows: requiredPositiveInteger(LABELS.gridRows),
  gridColumns: requiredPositiveInteger(LABELS.gridColumns),
  gridSpacingX: requiredPositiveNumber(LABELS.gridSpacingX),
  gridSpacingY: requiredPositiveNumber(LABELS.gridSpacingY),
  gridOffsetX: requiredPositiveNumber(LABELS.gridOffsetX),
  gridOffsetY: requiredPositiveNumber(LABELS.gridOffsetY),

  homogeneousWells: unsupportedLabwareIfFalse(LABELS.homogeneousWells),
  regularRowSpacing: unsupportedLabwareIfFalse(LABELS.regularRowSpacing),
  regularColumnSpacing: unsupportedLabwareIfFalse(LABELS.regularColumnSpacing),

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
  brandId: Yup.array().of(Yup.string()),

  loadName: requiredString(LABELS.loadName)
    .matches(
      /^[a-z0-9._]+$/,
      '${label} can only contain lowercase letters, numbers, dot (.) and underscore (_). Spaces are not allowed.' // eslint-disable-line no-template-curly-in-string
    )
    .notOneOf(
      getAllLoadNames(),
      'This load name already exists in the Opentrons default labware library. Please edit the load name to make it unique.'
    ),
  displayName: requiredString(LABELS.displayName),
})

export default labwareFormSchema
