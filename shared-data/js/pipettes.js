// @flow
import reduce from 'lodash/reduce'
import pipetteNameSpecs from '../robot-data/pipetteNameSpecs.json'
import pipetteModelSpecs from '../robot-data/pipetteModelSpecs.json'

export type PipetteChannels = 1 | 8

export type PipetteNameSpecs = {
  name: string,
  displayName: string,
  minVolume: number,
  maxVolume: number,
  defaultAspirateFlowRate: {value: number},
  defaultDispenseFlowRate: {value: number},
  channels: PipetteChannels,
}

export type PipetteModelSpecs = {
  model: string,
  tipLength: {value: number},
} & PipetteNameSpecs

export type PipetteModel =
  | 'p10_single'
  | 'p50_single'
  | 'p300_single'
  | 'p1000_single'
  | 'p10_multi'
  | 'p50_multi'
  | 'p300_multi'

type SortableProps =
  | 'maxVolume'
  | 'channels'

// models sorted by channels and then volume by default
const ALL_PIPETTE_NAMES: Array<string> = Object
  .keys(pipetteNameSpecs)
  .sort(comparePipettes(['channels', 'maxVolume']))

const ALL_PIPETTES: Array<PipetteNameSpecs> = ALL_PIPETTE_NAMES
  .map(getPipetteNameSpecs)
  .filter(Boolean)

// use a name like 'p10_single' to get specs true for all models under that name
export function getPipetteNameSpecs (name: string): ?PipetteNameSpecs {
  const config = pipetteNameSpecs[name]
  return config && {...config, name}
}

// specify a model, eg 'p10_single_v1.3' to get
// both the name specs + model-specific specs
// NOTE: this should NEVER be used in PD, which is model-agnostic
export function getPipetteModelSpecs (model: string): ?PipetteModelSpecs {
  const modelSpecificFields = pipetteModelSpecs.config[model]
  const modelFields = modelSpecificFields &&
    getPipetteNameSpecs(modelSpecificFields.name)
  return modelFields && {...modelFields, ...modelSpecificFields}
}

export function getAllPipetteNames (
  ...sortBy: Array<SortableProps>
): Array<string> {
  const models = [...ALL_PIPETTE_NAMES]

  if (sortBy.length) models.sort(comparePipettes(sortBy))

  return models
}

export function getPipetteDisplayNames (
  ...sortBy: Array<SortableProps>
): Array<string> {
  return getAllPipetteNames(...sortBy)
    .reduce((result, model) => {
      const {seen, names} = result
      const {displayName} = getPipetteNameSpecs(model) || {displayName: ''}

      if (displayName && !seen[displayName]) {
        seen[displayName] = true
        names.push(displayName)
      }

      return {seen, names}
    }, {seen: {}, names: []})
    .names
}

// TODO: Ian + Mike 2018-11-06 - DEPRECATED! This function can and should go
// away once we can switch the app to checking `name` rather than `displayName`
// or `model` for pipette correctness
export function getPipetteChannelsByDisplayName (name: ?string): PipetteChannels {
  const match = ALL_PIPETTES.find(p => p.displayName === name)

  // default to single-channel if name doesn't match
  return match ? match.channels : 1
}

function comparePipettes (sortBy: Array<SortableProps>) {
  return (modelA, modelB) => {
    // any cast is because we know these pipettes exist
    const a: PipetteNameSpecs = (getPipetteNameSpecs(modelA): any)
    const b: PipetteNameSpecs = (getPipetteNameSpecs(modelB): any)

    let i
    for (i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]
      if (a[sortKey] < b[sortKey]) return -1
      if (a[sortKey] > b[sortKey]) return 1
    }

    return 0
  }
}

export function getFlowRateDefaultsAllPipettes (flowRateName: 'defaultAspirateFlowRate' | 'defaultDispenseFlowRate'): {[pipetteName: string]: number} {
  return reduce(pipetteNameSpecs, (acc, spec: PipetteNameSpecs, pipetteName: string) => ({
    ...acc,
    [pipetteName]: spec[flowRateName].value,
  }), {})
}
