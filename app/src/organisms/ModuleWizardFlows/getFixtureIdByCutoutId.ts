import {
  FLEX_ROBOT_TYPE,
  getCutoutFixturesForModuleModel,
  getDeckDefFromRobotType,
  getFixtureIdByCutoutIdFromModuleSlotName,
} from '@opentrons/shared-data'

import type { AttachedModule } from '@opentrons/api-client'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'

export function getFixtureIdByCutoutId(
  attachedModule: AttachedModule,
  deckConfig: DeckConfiguration
): { [cutoutId in CutoutId]?: CutoutFixtureId } {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const moduleCutoutConfig = deckConfig.find(
    cc => cc.opentronsModuleSerialNumber === attachedModule.serialNumber
  )
  // mapping of cutoutId's occupied by the target module and their cutoutFixtureId's per cutout
  const fixtureIdByCutoutId =
    moduleCutoutConfig != null
      ? getFixtureIdByCutoutIdFromModuleSlotName(
          moduleCutoutConfig.cutoutId.replace('cutout', ''),
          getCutoutFixturesForModuleModel(attachedModule.moduleModel, deckDef),
          deckDef
        )
      : {}

  return fixtureIdByCutoutId
}
