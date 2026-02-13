import { parseLiquidsInLoadOrder } from './parseProtocolCommands'

import type { CSSProperties } from 'react'
import type { RunTimeCommand } from '../../protocol'
import type { Liquid } from '../types'
import type { LabwareByLiquidId } from './getLabwareInfoByLiquidId'

export function getWellFillFromLabwareId(
  labwareId: string,
  liquids: Liquid[],
  labwareByLiquidId: LabwareByLiquidId,
  commands: RunTimeCommand[]
): Record<string, CSSProperties['fill']> {
  let labwareWellFill = {}
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
