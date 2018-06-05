// @flow
import pipetteConfigByModel from '../robot-data/pipette-config.json'

export type PipetteChannels = 1 | 8

export type PipetteConfig = {
  model: string,
  displayName: string,
  nominalMaxVolumeUl: number,
  plungerPositions: {
    top: number,
    bottom: number,
    blowOut: number,
    dropTip: number,
  },
  pickUpCurrent: number,
  aspirateFlowRate: number,
  dispenseFlowRate: number,
  ulPerMm: number,
  channels: PipetteChannels,
  modelOffset: [number, number, number],
  tipLength: number,
}

type SortableProps =
  | 'nominalMaxVolumeUl'
  | 'channels'

// models sorted by channels and then volume by default
const ALL_MODELS: Array<string> = Object
  .keys(pipetteConfigByModel)
  .sort(comparePipettes(['channels', 'nominalMaxVolumeUl']))

const ALL_PIPETTES: Array<PipetteConfig> = ALL_MODELS
  .map(getPipette)
  .filter(Boolean)

export function getPipette (model: string): ?PipetteConfig {
  const config = pipetteConfigByModel[model]

  return config && {...config, model: model}
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
      const {displayName} = getPipette(model) || {displayName: ''}

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
    const a: PipetteConfig = (getPipette(modelA): any)
    const b: PipetteConfig = (getPipette(modelB): any)

    let i
    for (i = 0; i < sortBy.length; i++) {
      const sortKey = sortBy[i]
      if (a[sortKey] < b[sortKey]) return -1
      if (a[sortKey] > b[sortKey]) return 1
    }

    return 0
  }
}
