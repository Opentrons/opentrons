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

export function getPipette (model: string): ?PipetteConfig {
  const config = pipetteConfigByModel[model]

  return config && {...config, model: model}
}

export function getPipetteModels (...sortBy: Array<SortableProps>) {
  const models = [...ALL_MODELS]

  if (sortBy.length) models.sort(comparePipettes(sortBy))

  return models
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
