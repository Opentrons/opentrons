import { getLiquidsByIdForLabware } from './getLiquidsByIdForLabware'

import type { LabwareInStack, LabwareLiquidRenderInfo } from '../types'
import type { LabwareByLiquidId } from './getLabwareInfoByLiquidId'

export function getLabwareLiquidRenderInfoFromStack(
  labwareInStack: LabwareInStack[],
  labwareByLiquidId?: LabwareByLiquidId
): LabwareLiquidRenderInfo[] {
  return labwareInStack.reduce<LabwareLiquidRenderInfo[]>((acc, stackItem) => {
    const liquidInfo =
      labwareByLiquidId != null
        ? getLiquidsByIdForLabware(stackItem.labwareId, labwareByLiquidId)
        : {}
    const liquidCount = Object.keys(liquidInfo).length
    const matchingLabwareIndex = acc.findIndex(
      lw =>
        lw.definitionUri === stackItem.definitionUri &&
        (lw.lidDisplayName == null ||
          lw.lidDisplayName === stackItem.lidDisplayName)
    )
    if (
      matchingLabwareIndex !== -1 &&
      matchingLabwareIndex === acc.length - 1
    ) {
      acc[matchingLabwareIndex].quantity += 1
      acc[matchingLabwareIndex].liquids += liquidCount
    } else {
      acc.push({
        ...stackItem,
        quantity: 1,
        liquids: liquidCount,
      })
    }
    return acc
  }, [])
}
