import { isFixtureInUsbModules } from '../fixtures'

import type { CutoutFixtureId, CutoutId } from '../../deck'
import type { CutoutFixtureIdsWithFakes } from '../constants'
import type { DeckConfiguration, DeckDefinition } from '../types'

//  used in both PD and the app for getting the new deck configuration
//  the usb info is only needed for the app
export const getNewConfigForDeckConfig = (
  cutoutId: CutoutId,
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  replacementFixtureId: CutoutFixtureId,
  deckConfig: DeckConfiguration,
  deckDef: DeckDefinition,
  showUSBInfo: boolean
): DeckConfiguration => {
  const fixtureGroup =
    deckDef.cutoutFixtures.find(cf => cf.id === cutoutFixtureId)
      ?.fixtureGroup ?? {}

  let newDeckConfig = deckConfig
  if (cutoutId in fixtureGroup) {
    const groupMap =
      fixtureGroup[cutoutId]?.find(group =>
        Object.entries(group).every(([cId, cfId]) =>
          deckConfig.find(
            config => config.cutoutId === cId && config.cutoutFixtureId === cfId
          )
        )
      ) ?? {}
    newDeckConfig = deckConfig.map(cutoutConfig =>
      cutoutConfig.cutoutId in groupMap
        ? {
            ...cutoutConfig,
            cutoutFixtureId: replacementFixtureId,
            opentronsModuleSerialNumber: undefined,
          }
        : cutoutConfig
    )
  } else {
    newDeckConfig = deckConfig.map(cutoutConfig => {
      return cutoutConfig.cutoutId === cutoutId
        ? {
            ...cutoutConfig,
            cutoutFixtureId: replacementFixtureId,
            opentronsModuleSerialNumber:
              showUSBInfo && isFixtureInUsbModules(replacementFixtureId)
                ? cutoutConfig.opentronsModuleSerialNumber
                : undefined,
          }
        : cutoutConfig
    })
  }
  return newDeckConfig
}
