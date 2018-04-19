// @flow
import pipetteConfigByModel from '../robot-data/pipette-config.json'

const allModels: Array<string> = Object.keys(pipetteConfigByModel)

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

export function getPipette (model: string): ?PipetteConfig {
  const config = pipetteConfigByModel[model]

  return config && {...config, model: model}
}

export function getAllPipetteModels () {
  return [...allModels]
}
