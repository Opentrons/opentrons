import capitalize from 'lodash/capitalize'
import type {
  LabwareDefinition2,
  WellBottomShape,
} from '@opentrons/shared-data'
import { displayAsTube, getLabwareName } from './utils'

export const MAX_X_DIMENSION = 129
export const MIN_X_DIMENSION = 127
export const SUGGESTED_X = 127.76

export const MAX_Y_DIMENSION = 87
export const MIN_Y_DIMENSION = 85
export const SUGGESTED_Y = 85.47

export const SUGGESTED_XY_RANGE = 1

export const MAX_Z_DIMENSION = 195
export const MAX_SUGGESTED_Z = 124

export const DISPLAY_VOLUME_UNITS = 'µL'

// magic string for all validation errors that direct user away to the labware request form
export const IRREGULAR_LABWARE_ERROR = 'IRREGULAR_LABWARE_ERROR'

export const REQUIRED_FIELD_ERROR = 'REQUIRED_FIELD_ERROR'
export const MUST_BE_A_NUMBER_ERROR = 'MUST_BE_A_NUMBER_ERROR'

export const LOOSE_TIP_FIT_ERROR = 'LOOSE_TIP_FIT_ERROR'

export const LABWARE_TOO_SMALL_ERROR = 'LABWARE_TOO_SMALL_ERROR'
export const LABWARE_TOO_LARGE_ERROR = 'LABWARE_TOO_LARGE_ERROR'

export const LINK_CUSTOM_LABWARE_FORM = 'https://lqilf9ng.paperform.co/'

export const LINK_REQUEST_ADAPTER_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLScvsHlXQrtIhIQYO0zr6mYwmzOCGpYPqepeDIorFIyj2jT-UQ/viewform'

export type ImportErrorKey =
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON_FILE'
  | 'INVALID_LABWARE_DEF'
  | 'UNSUPPORTED_LABWARE_PROPERTIES'
export interface ImportError {
  key: ImportErrorKey
  messages?: string[]
}

export interface Option {
  name: string
  value: string
  disabled?: boolean
  imgSrc?: string
}
export type Options = Option[]

// NOTE: annoyingly, some components support "rich" `name` values (eg Dropdown)
// that can be a JSX.Element, and others like RadioField only support string values for `name` :(
export interface RichOption {
  name: string | JSX.Element
  value: string
  disabled?: boolean
  imgSrc?: string
}
export type RichOptions = readonly RichOption[]

export type LabwareType =
  | 'wellPlate'
  | 'reservoir'
  | 'tubeRack'
  | 'aluminumBlock'
  | 'tipRack'
export const labwareTypeOptions: Options = [
  { name: 'Well Plate', value: 'wellPlate' },
  { name: 'Reservoir', value: 'reservoir' },
  { name: 'Tubes + Tube Rack', value: 'tubeRack' },
  { name: 'Tubes / Plates + Opentrons Aluminum Block', value: 'aluminumBlock' },
  { name: 'Tip Rack', value: 'tipRack' },
]

export type WellShape = 'circular' | 'rectangular'
export const wellShapeOptions: Options = [
  { name: 'Circular', value: 'circular' },
  { name: 'Rectangular', value: 'rectangular' },
]

export const wellBottomShapeOptions: Options = [
  { name: 'Flat', value: 'flat' },
  { name: 'Round', value: 'u' },
  { name: 'V-Bottom', value: 'v' },
]

export type BooleanString = 'true' | 'false'

export const yesNoOptions = [
  { name: 'Yes', value: 'true' },
  { name: 'No', value: 'false' },
]

export const snugLooseOptions = [
  { name: 'Snug', value: 'snug' },
  { name: 'Loose', value: 'loose' },
]

export interface LabwareFields {
  labwareType: LabwareType | null | undefined
  tubeRackInsertLoadName: string | null | undefined
  aluminumBlockType: string | null | undefined // eg, '24well' or '96well'
  aluminumBlockChildType: string | null | undefined

  handPlacedTipFit: 'snug' | 'loose' | null | undefined
  // tubeRackSides: string[], // eg, []
  footprintXDimension: string | null | undefined
  footprintYDimension: string | null | undefined
  labwareZDimension: string | null | undefined

  gridRows: string | null | undefined
  gridColumns: string | null | undefined
  gridSpacingX: string | null | undefined
  gridSpacingY: string | null | undefined
  gridOffsetX: string | null | undefined
  gridOffsetY: string | null | undefined

  homogeneousWells: BooleanString | null | undefined
  regularRowSpacing: BooleanString | null | undefined
  regularColumnSpacing: BooleanString | null | undefined

  wellVolume: string | null | undefined
  wellBottomShape: WellBottomShape | null | undefined
  wellDepth: string | null | undefined
  wellShape: WellShape | null | undefined

  // used with circular well shape only
  wellDiameter: string | null | undefined

  // used with rectangular well shape only
  wellXDimension: string | null | undefined
  wellYDimension: string | null | undefined

  brand: string | null | undefined
  brandId: string | null | undefined // comma-separated values
  groupBrand: string | null | undefined
  groupBrandId: string | null | undefined // comma-separated values

  loadName: string | null | undefined
  displayName: string | null | undefined
}

// NOTE: these fields & types should be kept in sync with Yup schema `labwareFormSchema`.
// Also, this type def is simplified -- IRL, wellDiameter is only a number when wellShape === 'circular', and void otherwise.
// These could be represented by some complex union types, but that wouldn't really get us anywhere.
// Yup and not Flow is the authority on making sure the data is correct here.
export interface ProcessedLabwareFields {
  labwareType: LabwareType
  tubeRackInsertLoadName: string
  aluminumBlockType: string
  aluminumBlockChildType: string | null
  handPlacedTipFit: string | null

  // tubeRackSides: string[], // eg, []
  footprintXDimension: number
  footprintYDimension: number
  labwareZDimension: number

  gridRows: number
  gridColumns: number
  gridSpacingX: number
  gridSpacingY: number
  gridOffsetX: number
  gridOffsetY: number

  homogeneousWells: BooleanString
  regularRowSpacing: BooleanString
  regularColumnSpacing: BooleanString

  wellVolume: number
  wellBottomShape: WellBottomShape | null
  wellDepth: number
  wellShape: WellShape

  // used with circular well shape only
  wellDiameter: number

  // used with rectangular well shape only
  wellXDimension: number
  wellYDimension: number

  brand: string
  brandId: string[]
  groupBrand: string
  groupBrandId: string[]

  // if loadName or displayName are left blank, Yup schema generates them
  loadName: string
  displayName: string
}

export const tubeRackInsertOptions: Options = [
  {
    name: 'Opentrons 6 tubes',
    value: '6tubes',
    imgSrc: require('./images/6x50mL_insert_large.png'),
  },
  {
    name: 'Opentrons 15 tubes',
    value: '15tubes',
    imgSrc: require('./images/15x15mL_insert_large.png'),
  },
  {
    name: 'Opentrons 24 tubes',
    value: '24tubesSnapCap',
    imgSrc: require('./images/24x1_5mL_insert_large.png'),
  },
  {
    name: 'Opentrons 10 tubes',
    value: '10tubes',
    imgSrc: require('./images/6x15mL_and_4x50mL_insert_large.png'),
    disabled: true, // 6 + 4 tube rack not yet supported
  },
  {
    name: 'Non-Opentrons tube rack',
    value: 'customTubeRack',
    imgSrc: require('./images/blank_insert_large.png'),
  },
]

export const DEFAULT_RACK_BRAND = 'Opentrons'

// fields that get auto-filled when tubeRackInsertLoadName is selected
// NOTE: these are duplicate data derived from tube rack defs, but
// are intentionally duplicated to be the source of truth about the
// *tube rack inserts* (as opposed to defs that use the insert)
export const tubeRackAutofills: {
  [tubeRackInsertLoadName: string]: Partial<LabwareFields>
} = {
  '6tubes': {
    // NOTE: based on opentrons_6_tuberack_falcon_50ml_conical
    footprintXDimension: '127.76',
    footprintYDimension: '85.48',
    gridRows: '2',
    gridColumns: '3',
    gridSpacingX: '35.0',
    gridSpacingY: '35.0',
    gridOffsetX: '35.50',
    gridOffsetY: '25.24',
    regularRowSpacing: 'true',
    regularColumnSpacing: 'true',
  },
  '24tubesSnapCap': {
    // NOTE: based on opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '4',
    gridColumns: '6',
    gridSpacingX: '19.89',
    gridSpacingY: '19.28',
    gridOffsetX: '18.21',
    gridOffsetY: '10.07',
    regularRowSpacing: 'true',
    regularColumnSpacing: 'true',
  },
  '15tubes': {
    // NOTE: based on opentrons_15_tuberack_falcon_15ml_conical
    footprintXDimension: '127.76',
    footprintYDimension: '85.48',
    gridRows: '3',
    gridColumns: '5',
    gridSpacingX: '25.00',
    gridSpacingY: '25.00',
    gridOffsetX: '13.88',
    gridOffsetY: '17.74',
    regularRowSpacing: 'true',
    regularColumnSpacing: 'true',
  },
  customTubeRack: {}, // not an insert, no autofills
}

// NOTE: these images are from labware-library, not labware creator's local images dir
export const aluminumBlockTypeOptions: Options = [
  {
    name: '96 well',
    value: '96well',
    imgSrc: require('./images/opentrons_96_aluminumblock_side_view.png'),
  },
  {
    name: '24 well',
    value: '24well',
    imgSrc: require('./images/opentrons_24_aluminumblock_side_view.png'),
  },
  {
    name: 'Flat - not available',
    value: 'flat',
    imgSrc: require('./images/opentrons_flat_aluminumblock_side_view.png'),
    disabled: true,
  },
]

export const aluminumBlockAutofills = {
  '24well': {
    // NOTE: based on opentrons_24_aluminumblock_generic_2ml_screwcap
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '4',
    gridColumns: '6',
    gridSpacingX: '17.25',
    gridSpacingY: '17.25',
    gridOffsetX: '20.75',
    gridOffsetY: '16.87',
    regularRowSpacing: 'true',
    regularColumnSpacing: 'true',
  },
  '96well': {
    // NOTE: based on opentrons_96_aluminumblock_generic_pcr_strip_200ul
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '8',
    gridColumns: '12',
    gridSpacingX: '9.00',
    gridSpacingY: '9.00',
    gridOffsetX: '14.38',
    gridOffsetY: '11.25',
    regularRowSpacing: 'true',
    regularColumnSpacing: 'true',
  },
} as const

export const labwareTypeAutofills = {
  tipRack: {
    homogeneousWells: 'true',
    wellShape: 'circular',
    wellBottomShape: null,
  },
  tubeRack: {},
  wellPlate: {},
  reservoir: {},
  aluminumBlock: {},
} as const

export const aluminumBlockChildTypeOptions = [
  {
    name: 'Tubes',
    value: 'tubes',
  },
  {
    name: 'PCR Tube Strip',
    value: 'pcrTubeStrip',
  },
  {
    name: 'PCR Plate',
    value: 'pcrPlate',
  },
] as const

export const getInitialStatus = (): FormStatus => ({
  defaultedDef: null,
  prevValues: null,
})

export const getDefaultFormState = (): LabwareFields => ({
  labwareType: null,
  tubeRackInsertLoadName: null,
  aluminumBlockType: null,
  aluminumBlockChildType: null,

  handPlacedTipFit: null,
  // tubeRackSides: [],
  footprintXDimension: null,
  footprintYDimension: null,
  labwareZDimension: null,

  gridRows: null,
  gridColumns: null,
  gridSpacingX: null,
  gridSpacingY: null,
  gridOffsetX: null,
  gridOffsetY: null,

  homogeneousWells: null,
  regularRowSpacing: null,
  regularColumnSpacing: null,

  wellVolume: null,
  wellBottomShape: 'flat',
  wellDepth: null,
  wellShape: 'circular',

  // used with circular well shape only
  wellDiameter: null,

  // used with rectangular well shape only
  wellXDimension: null,
  wellYDimension: null,

  brand: null,
  brandId: null,
  groupBrand: null,
  groupBrandId: null,

  loadName: null,
  displayName: null,
})

export const LABELS: Record<keyof LabwareFields, string> = {
  labwareType: 'What type of labware are you creating?',
  tubeRackInsertLoadName: 'Which tube rack?',
  aluminumBlockType: 'Which aluminum block?',
  aluminumBlockChildType: 'What labware is on top of your aluminum block?',
  handPlacedTipFit: 'Fit',
  homogeneousWells: 'Are all your wells the same shape and size?',
  footprintXDimension: 'Length',
  footprintYDimension: 'Width',
  labwareZDimension: 'Height',
  gridRows: 'Number of rows',
  gridColumns: 'Number of columns',
  regularRowSpacing: 'Are all of your rows evenly spaced?',
  regularColumnSpacing: 'Are all of your columns evenly spaced?',
  wellVolume: 'Volume',
  wellShape: 'Well shape',
  wellDiameter: 'Diameter',
  wellXDimension: 'Well X',
  wellYDimension: 'Well Y',
  wellBottomShape: 'Bottom shape',
  wellDepth: 'Depth',
  gridSpacingX: 'X Spacing (Xs)',
  gridSpacingY: 'Y Spacing (Ys)',
  gridOffsetX: 'X Offset (Xo)',
  gridOffsetY: 'Y Offset (Yo)',
  brand: 'Brand',
  brandId: 'Manufacturer/Catalog #',
  groupBrand: 'Tube Brand',
  groupBrandId: 'Manufacturer/Catalog #',
  displayName: 'Display Name',
  loadName: 'API Load Name',
}

export const getLabel = (
  name: keyof LabwareFields,
  values: LabwareFields
): string => {
  if (name === 'homogeneousWells') {
    return `Are all your ${getLabwareName(
      values,
      true
    )} the same shape and size?`
  } else if (name === 'brand' && values.labwareType === 'tubeRack') {
    return 'Rack Brand'
  }
  if (name === 'wellShape') {
    return `${capitalize(getLabwareName(values, false))} shape`
  }
  if (name === 'wellXDimension' && displayAsTube(values)) {
    return 'Tube X'
  }
  if (name === 'wellYDimension' && displayAsTube(values)) {
    return 'Tube Y'
  }
  return LABELS[name]
}

// type of Formik status. We can't type status in useFormikContext so
// this interface needs to be used explicitly each time :(
export interface FormStatus {
  defaultedDef: LabwareDefinition2 | null
  prevValues: LabwareFields | null
}
