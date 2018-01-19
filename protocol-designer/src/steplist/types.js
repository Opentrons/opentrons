// @flow

// TODO Ian 2018-01-16 factor out to steplist/constants.js ?
export const stepIconsByType = {
  'transfer': 'arrow right',
  'distribute': 'distribute',
  'consolidate': 'consolidate',
  'mix': 'mix',
  'pause': 'pause'
}

export type StepType = $Keys<typeof stepIconsByType>

export type StepIdType = number

export type StepSubItemData = {
  sourceIngredientName?: string,
  destIngredientName?: string,
  sourceWell?: string,
  destWell?: string,
}

export type StepItemData = {
  id: StepIdType,
  title: string,
  stepType: StepType,
  substeps: Array<StepSubItemData>,
  description?: string,
  sourceLabwareName?: string,
  destLabwareName?: string
}
