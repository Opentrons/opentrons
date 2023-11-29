import {
  INTRODUCTION,
  CHOOSE_TIP_RACK,
  CHOOSE_SOURCE,
  CHOOSE_DESTINATION,
  SUCCESS,
} from './constants'

export type PlateFillWizardStep =
  | typeof INTRODUCTION
  | typeof CHOOSE_TIP_RACK
  | typeof CHOOSE_SOURCE
  | typeof CHOOSE_DESTINATION
  | typeof SUCCESS
