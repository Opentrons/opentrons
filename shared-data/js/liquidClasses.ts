import ethanol80V1Uncasted from '../liquid-class/definitions/1/ethanol_80/2.json'
import glycerol50V1Uncasted from '../liquid-class/definitions/1/glycerol_50/2.json'
import waterV2Uncasted from '../liquid-class/definitions/1/water/2.json'

import type { LiquidClass } from '.'

const ethanol80V2 = ethanol80V1Uncasted as LiquidClass
const glycerol50V2 = glycerol50V1Uncasted as LiquidClass
const waterV2 = waterV2Uncasted as LiquidClass

export const WATER_LIQUID_CLASS_NAME_V2 = 'waterV2'
export const NONE_LIQUID_CLASS_NAME = 'none'
export const GLYCEROL_LIQUID_CLASS_NAME_V2 = 'glycerol50V2'
export const ETHANOL_LIQUID_CLASS_NAME_V2 = 'ethanol80V2'

const defs = { waterV2, glycerol50V2, ethanol80V2 }

//  returns all liquid class defs but their latest version only
//  NOTE: we should refactor this util though to get the latest versions of all the definitions types
//  that exist. right now, its hard-coded in which means we need to manually
//  update it every time, which is not great.
export const getAllLiquidClassDefs = (): Record<string, LiquidClass> => defs
