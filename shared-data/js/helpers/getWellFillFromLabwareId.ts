import { parseLiquidsInLoadOrder } from './parseProtocolCommands'

import type { RunTimeCommand } from '../../protocol'
import type { Liquid } from '../types'
import type { LabwareByLiquidId } from './getLabwareInfoByLiquidId'

export type WellFill = Record<string, string>

export function getWellFillFromLabwareId(
  labwareId: string,
  liquids: Liquid[],
  labwareByLiquidId: LabwareByLiquidId,
  commands: RunTimeCommand[]
): WellFill {
  let labwareWellFill: WellFill = {}
  const liquidsInLoadOrder = parseLiquidsInLoadOrder(liquids, commands)
  const liquidIds = Object.keys(labwareByLiquidId)
  const labwareInfo = Object.values(labwareByLiquidId)

  labwareInfo.forEach((labwareArray, index) => {
    labwareArray.forEach(labware => {
      if (labware.labwareId === labwareId) {
        const liquidId = liquidIds[index]
        const liquid = liquidsInLoadOrder.find(liquid => liquid.id === liquidId)
        const wellFill: {
          [well: string]: string
        } = {}
        Object.keys(labware.volumeByWell).forEach(key => {
          wellFill[key] = liquid?.displayColor ?? ''
        })
        labwareWellFill = { ...labwareWellFill, ...wellFill }
      }
    })
  })
  return labwareWellFill
}
