// @flow
import mapValues from 'lodash/mapValues'
import pipetteModelSpecs from '../robot-data/pipetteModelSpecs.json'
import pipetteVersionSpecs from '../robot-data/pipetteVersionSpecs.json'

export type PipetteChannels = 1 | 8

export type PipetteModelSpecs = {
  model: string,
  displayName: string,
  minVolume: number,
  maxVolume: number,
  defaultAspirateFlowRate: number,
  defaultDispenseFlowRate: number,
  channels: PipetteChannels,
}

export type VersionedPipetteSpecs = {
  tipLength: number,
} & PipetteModelSpecs

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
const ALL_MODELS: Array<string> = Object
  .keys(pipetteModelSpecs)
  .sort(comparePipettes(['channels', 'maxVolume']))

const ALL_PIPETTES: Array<PipetteModelSpecs> = ALL_MODELS
  .map(getPipetteModelSpecs)
  .filter(Boolean)

// use a versionless model like 'p10_single' to get
// specs true for all versions of that model
export function getPipetteModelSpecs (model: string): ?PipetteModelSpecs {
  const config = pipetteModelSpecs[model]

  return config && {...config, model: model}
}

// specify a versioned model, eg 'p10_single_v1.3' to get
// both the model specs + version-specific specs
// NOTE: this should NEVER be used in PD, which is pipette-version agnostic
export function getVersionedPipetteSpecs (versionedModel: string): ?VersionedPipetteSpecs {
  const versionSpecificFields = pipetteVersionSpecs[versionedModel]
  const modelFields = versionSpecificFields &&
    getPipetteModelSpecs(versionSpecificFields.model)
  return modelFields && {...modelFields, ...versionSpecificFields}
}

export function getPipetteModels (
  ...sortBy: Array<SortableProps>
): Array<string> {
  const models = [...ALL_MODELS]

  if (sortBy.length) models.sort(comparePipettes(sortBy))

  return models
}

export function getPipetteNames (
  ...sortBy: Array<SortableProps>
): Array<string> {
  return getPipetteModels(...sortBy)
    .reduce((result, model) => {
      const {seen, names} = result
      const {displayName} = getPipetteModelSpecs(model) || {displayName: ''}

      if (displayName && !seen[displayName]) {
        seen[displayName] = true
        names.push(displayName)
      }

      return {seen, names}
    }, {seen: {}, names: []})
    .names
}

// note: this function assumes all pipettes with the same display name have
// the same number of channels. This feels like a sane assumption
export function getPipetteChannelsByName (name: ?string): PipetteChannels {
  const match = ALL_PIPETTES.find(p => p.displayName === name)

  // default to single-channel if name doesn't match
  return match ? match.channels : 1
}

function comparePipettes (sortBy: Array<SortableProps>) {
  return (modelA, modelB) => {
    // any cast is because we know these pipettes exist
    const a: PipetteModelSpecs = (getPipetteModelSpecs(modelA): any)
    const b: PipetteModelSpecs = (getPipetteModelSpecs(modelB): any)

    let i
    for (i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]
      if (a[sortKey] < b[sortKey]) return -1
      if (a[sortKey] > b[sortKey]) return 1
    }

    return 0
  }
}

export function getPropertyAllPipettes (propertyName: $Keys<PipetteModelSpecs>) {
  return mapValues(pipetteModelSpecs, config => config[propertyName])
}
