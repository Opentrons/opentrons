import type { ByPipetteSetting, ByTipTypeSetting } from '@opentrons/shared-data'

export const getExtractTiprackTypeFromURI = (
  liquidClassValuesForPipette: ByPipetteSetting | undefined,
  currentTiprackLoadName: string
): ByTipTypeSetting | undefined => {
  if (liquidClassValuesForPipette == null) return undefined
  return liquidClassValuesForPipette?.byTipType.find(
    (tipObject: ByTipTypeSetting) => {
      const tiprackLoadName = tipObject.tiprack.split('/')[1]
      return tiprackLoadName === currentTiprackLoadName
    }
  )
}
