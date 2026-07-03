import sum from 'lodash/sum'

import { COLORS } from '@opentrons/components'
import {
  getLiquidIdsOnLabware,
  getVolumesPerLiquid,
} from '@opentrons/step-generation'

import type { Liquid } from '@opentrons/shared-data'
import type { ContentsByWell } from '@opentrons/step-generation'

interface LiquidDetailInfo {
  totalVolume: number
  color: string
  displayName: string
}

export const getLiquidDetailInfo = (
  wellContents: ContentsByWell,
  liquids: Liquid[]
): LiquidDetailInfo[] => {
  const individualIds = getLiquidIdsOnLabware(wellContents)
  const volumesPerLiquid = getVolumesPerLiquid(wellContents, individualIds)
  const liquidInfo: LiquidDetailInfo[] = individualIds.map(liquidId => {
    const totalVolume = sum(Object.values(volumesPerLiquid[liquidId]))
    const matchingLiquid = liquids.find(liquid => liquid.id === liquidId)

    return {
      totalVolume,
      //  TODO: add default liquid color
      color: matchingLiquid?.displayColor ?? COLORS.black70,
      displayName: matchingLiquid?.displayName ?? 'unknown display name',
    }
  })
  return liquidInfo
}
