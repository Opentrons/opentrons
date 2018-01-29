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
  parentStepId: StepIdType,
  substepId: number,
  sourceIngredientName?: string,
  destIngredientName?: string,
  sourceWell?: string,
  destWell?: string,
}

export type StepItemData = {
  id: StepIdType,
  title: string,
  stepType: StepType,
  description?: string
}

export type FormData = {
  'aspirate--labware': string,
  'aspirate--wells': string,
  'aspirate--pipette': string,
  'aspirate--pre-wet-tip': boolean,
  'aspirate--touch-tip': boolean,
  'aspirate--air-gap--checkbox': boolean,
  'aspirate--air-gap--volume': string,
  'aspirate--mix--checkbox': boolean,
  'aspirate--mix--volume': string,
  'aspirate--mix--time': string,
  'aspirate--disposal-vol--checkbox': boolean,
  'aspirate--disposal-vol--volume': string,
  'aspirate--change-tip': string,
  'dispense--labware': string,
  'dispense--wells': string,
  'dispense--volume': string,
  'dispense--mix--checkbox': boolean,
  'dispense--mix--volume': string,
  'dispense--mix--times': string,
  'dispense--delay--checkbox': boolean,
  'dispense--delay-minutes': string,
  'dispense--delay-seconds': string,
  'dispense--blowout--checkbox': boolean,
  'dispense--blowout--labware': string
}
