import round from 'lodash/round'

import pipetteNameSpecs from '../pipette/definitions/1/pipetteNameSpecs.json'
import pipetteModelSpecs from '../pipette/definitions/1/pipetteModelSpecs.json'
import {
  B_MAX_SPEED,
  DEFAULT_MAX_SPEED_HIGH_THROUGHPUT_FLEX_AXIS_KIND_P,
  DEFAULT_MAX_SPEED_LOW_THROUGHPUT_FLEX_AXIS_KIND_P,
  OT3_PIPETTES,
} from './constants'
import type {
  PipetteV2Specs,
  PipetteV2GeneralSpecs,
  PipetteV2GeometrySpecs,
  PipetteV2LiquidSpecs,
  PipetteNameSpecs,
  PipetteModelSpecs,
  SupportedTip,
} from './types'

type GeneralGeometricModules = PipetteV2GeneralSpecs | PipetteV2GeometrySpecs
interface GeneralGeometricSpecs {
  default: GeneralGeometricModules
}
interface LiquidSpecs {
  default: PipetteV2LiquidSpecs
}

const generalGeometric: Record<
  string,
  GeneralGeometricSpecs
> = import.meta.glob('../pipette/definitions/2/*/*/*/*.json', { eager: true })

const liquid: Record<string, LiquidSpecs> = import.meta.glob(
  '../pipette/definitions/2/liquid/*/*/*/*.json',
  {
    eager: true,
  }
)

type PipChannelString = 'single' | 'multi' | '96'
type Channels = 'eight_channel' | 'single_channel' | 'ninety_six_channel'
type Gen = 'gen1' | 'gen2' | 'gen3' | 'flex'
type SortableProps = 'maxVolume' | 'channels'
type GenNumber = 1 | 2 | 3

// TODO(mc, 2021-04-30): use these types, pulled directly from the JSON,
// to simplify return types in this module and possibly remove some `null`s
export type PipetteName = keyof typeof pipetteNameSpecs
export type PipetteModel = keyof typeof pipetteModelSpecs.config

// models sorted by channels and then volume by default
const ALL_PIPETTE_NAMES: PipetteName[] = (Object.keys(
  pipetteNameSpecs
) as PipetteName[]).sort(comparePipettes(['channels', 'maxVolume']))

// use a name like 'p10_single' to get specs true for all models under that name
export function getPipetteNameSpecs(
  name: PipetteName
): PipetteNameSpecs | null {
  const config = pipetteNameSpecs[name] as
    | Omit<PipetteNameSpecs, 'name'>
    | undefined
  return config != null ? { ...config, name } : null
}

// specify a model, eg 'p10_single_v1.3' to get
// both the name specs + model-specific specs
// NOTE: this should NEVER be used in PD, which is model-agnostic
export function getPipetteModelSpecs(
  model: PipetteModel
): PipetteModelSpecs | null | undefined {
  const modelSpecificFields = pipetteModelSpecs.config[model]
  const modelFields =
    modelSpecificFields &&
    getPipetteNameSpecs(modelSpecificFields.name as PipetteName)
  return modelFields && { ...modelFields, ...modelSpecificFields, model }
}

export function getAllPipetteNames(...sortBy: SortableProps[]): PipetteName[] {
  const models = [...ALL_PIPETTE_NAMES]
  if (sortBy.length) models.sort(comparePipettes(sortBy))
  return models
}

function comparePipettes(sortBy: SortableProps[]) {
  return (modelA: PipetteName, modelB: PipetteName) => {
    // any cast is because we know these pipettes exist
    const a = getPipetteNameSpecs(modelA) as PipetteNameSpecs
    const b = getPipetteNameSpecs(modelB) as PipetteNameSpecs
    let i

    for (i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]
      if (a[sortKey] < b[sortKey]) return -1
      if (a[sortKey] > b[sortKey]) return 1
    }

    return 0
  }
}

export function shouldLevel(specs: PipetteNameSpecs): boolean {
  return specs.displayCategory === 'GEN2' && specs.channels === 8
}

export function isFlexPipette(pipetteName: PipetteName): boolean {
  return (
    OT3_PIPETTES.includes(pipetteName) ||
    getPipetteNameSpecs(pipetteName)?.displayCategory === 'FLEX'
  )
}

export const getIncompatiblePipetteNames = (
  currentPipette: PipetteName
): string[] => {
  if (isFlexPipette(currentPipette)) {
    return getAllPipetteNames().filter(pipette => !isFlexPipette(pipette))
  } else if (
    getPipetteNameSpecs(currentPipette)?.displayCategory === 'GEN1' ||
    getPipetteNameSpecs(currentPipette)?.displayCategory === 'GEN2'
  ) {
    return getAllPipetteNames().filter(pipette => isFlexPipette(pipette))
  } else {
    return []
  }
}

export * from '../pipette/fixtures/name'
export * from '../pipette/fixtures/index'

const getChannelsFromString = (
  pipChannelString: PipChannelString
): Channels | null => {
  switch (pipChannelString) {
    case 'single': {
      return 'single_channel'
    }
    case 'multi': {
      return 'eight_channel'
    }
    case '96': {
      return 'ninety_six_channel'
    }
    default: {
      console.error(`invalid number of channels from ${pipChannelString}`)
      return null
    }
  }
}
const getVersionFromGen = (gen: Gen): string | null => {
  switch (gen) {
    case 'gen1': {
      return '1_0'
    }
    case 'gen2': {
      return '2_0'
    }
    case 'gen3':
    case 'flex': {
      return '3_0'
    }
    default: {
      return null
    }
  }
}

const V2_DEFINITION_TYPES = ['general', 'geometry']

/* takes in pipetteName such as 'p300_single' or 'p300_single_gen1' 
or PipetteModel such as 'p300_single_v1.3' and converts it to channels,
model, and version in order to return the correct pipette schema v2 json files. 
**/
export const getPipetteSpecsV2 = (
  name: PipetteName | PipetteModel
): PipetteV2Specs | null => {
  if (name == null) {
    return null
  }

  const nameSplit = name.split('_')
  const pipetteModel = nameSplit[0] // ex: p300
  const channels = getChannelsFromString(nameSplit[1] as PipChannelString) //  ex: single -> single_channel
  const gen = getVersionFromGen(nameSplit[2] as Gen)

  let version: string
  //  the first 2 conditions are to accommodate version from the pipetteName
  if (nameSplit.length === 2) {
    version = '1_0'
  } else if (gen != null) {
    version = gen //  ex: gen1 -> 1_0
    //  the 'else' is to accommodate the exact version if PipetteModel was added
  } else {
    const versionNumber = nameSplit[2].split('v')[1]
    if (versionNumber.includes('.')) {
      version = versionNumber.replace('.', '_') // ex: 1.0 -> 1_0
    } else {
      version = `${versionNumber}_0` //  ex: 1 -> 1_0
    }
  }

  const generalGeometricMatchingJsons = Object.entries(generalGeometric).reduce(
    (genericGeometricModules: GeneralGeometricModules[], [path, module]) => {
      V2_DEFINITION_TYPES.forEach(type => {
        if (
          `../pipette/definitions/2/${type}/${channels}/${pipetteModel}/${version}.json` ===
          path
        ) {
          genericGeometricModules.push(module.default)
        }
      })
      return genericGeometricModules
    },
    []
  )

  const liquidTypes: string[] = []
  const liquidMatchingJsons: {
    liquids: Record<string, PipetteV2LiquidSpecs>
  } = { liquids: {} }

  Object.entries(liquid).forEach(([path, module]) => {
    const type = path.split('/')[7]
    //  dynamically check the different liquid types and store unique types
    //  into an array to parse through
    if (!liquidTypes.includes(type)) {
      liquidTypes.push(type)
    }
    if (
      `../pipette/definitions/2/liquid/${channels}/${pipetteModel}/${type}/${version}.json` ===
      path
    ) {
      const index = liquidTypes.indexOf(type)
      const newKeyName = index !== -1 ? liquidTypes[index] : path
      liquidMatchingJsons.liquids[newKeyName] = module.default
    }
  })

  const pipetteV2Specs: PipetteV2Specs = {
    ...Object.assign({}, ...generalGeometricMatchingJsons),
    ...liquidMatchingJsons,
  }

  return pipetteV2Specs
}

const getPlungerMaxSpeed = (
  majorVersion: GenNumber,
  is96Channel: boolean
): number => {
  switch (majorVersion) {
    case 2: {
      return B_MAX_SPEED
    }
    case 3: {
      if (is96Channel) {
        return DEFAULT_MAX_SPEED_HIGH_THROUGHPUT_FLEX_AXIS_KIND_P
      } else {
        return DEFAULT_MAX_SPEED_LOW_THROUGHPUT_FLEX_AXIS_KIND_P
      }
    }
    default: {
      return 0
    }
  }
}

const getUlPerMm = (
  volume: number,
  supportedTipSpecs: SupportedTip
): number | undefined => {
  const allSequences = supportedTipSpecs.aspirate.default
  const sequence =
    Object.keys(allSequences).length === 1
      ? allSequences['1']
      : allSequences['2']

  const piecewiseVolumeConversion = (
    ul: number,
    seq: number[][]
  ): number | undefined => {
    for (let i = 0; i < seq.length; i++) {
      const x = seq[i]
      if (ul <= x[0]) {
        return x[1] * ul + x[2]
      }
    }
    return undefined
  }

  return piecewiseVolumeConversion(volume, sequence)
}

/* returns the maximum flow rate from a specific volume,
   and the support tip specs
**/
export const getMaxFlowRateByVolume = (
  supportedTipSpecs?: SupportedTip,
  volume?: number,
  name?: PipetteName | PipetteModel
): number => {
  if (
    name == null ||
    volume == null ||
    (volume != null && volume === 0) ||
    supportedTipSpecs == null
  ) {
    return 0
  }
  const nameSplit = name.split('_')
  const channels = getChannelsFromString(nameSplit[1] as PipChannelString)
  const getGenNumber = (gen: Gen): GenNumber | null => {
    switch (gen) {
      case 'gen1': {
        return 1
      }
      case 'gen2': {
        return 2
      }
      case 'gen3':
      case 'flex': {
        return 3
      }
      default: {
        return null
      }
    }
  }
  const gen = getGenNumber(nameSplit[2] as Gen)

  let genNumber: GenNumber = 1
  //  the first 2 conditions are to accommodate version from the pipetteName
  if (nameSplit.length === 2) {
    // special-casing 96-channel
    if (channels === 'ninety_six_channel') {
      genNumber = 3
    } else {
      genNumber = 1
    }
  } else if (gen != null) {
    genNumber = gen //  ex: gen1 -> 1
    //  the 'else' is to accommodate the exact version if PipetteModel was added
  } else {
    const versionNumber = nameSplit[2].split('v')[1]
    genNumber = parseInt(versionNumber[0]) as GenNumber //  ex: v3.3 -> 3
  }

  //  gen1 pipettes don't have max flow rates
  if (genNumber === 1) {
    return Infinity
  }

  const ulPerMm = getUlPerMm(volume, supportedTipSpecs) ?? 0
  const maxSpeed = getPlungerMaxSpeed(
    genNumber,
    channels === 'ninety_six_channel'
  )

  return round(ulPerMm * maxSpeed, 1)
}
