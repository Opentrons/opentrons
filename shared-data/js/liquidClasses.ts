import ethanol80V1Uncasted from '../liquid-class/definitions/1/ethanol_80/1.json'
import glycerol50V1Uncasted from '../liquid-class/definitions/1/glycerol_50/1.json'
import waterV1Uncasted from '../liquid-class/definitions/1/water/1.json'

import type { LiquidClass } from '.'

const ethanol80V1 = ethanol80V1Uncasted as LiquidClass
const glycerol50V1 = glycerol50V1Uncasted as LiquidClass
const waterV1 = waterV1Uncasted as LiquidClass

export const WATER_LIQUID_CLASS_NAME = 'waterV1'
export const NONE_LIQUID_CLASS_NAME = 'none'
export const GLYCEROL_LIQUID_CLASS_NAME = 'glycerol50V1'
export const ETHANOL_LIQUID_CLASS_NAME = 'ethanol80V1'

const defs = { waterV1, glycerol50V1, ethanol80V1 }

export const getAllLiquidClassDefs = (): Record<string, LiquidClass> => defs
