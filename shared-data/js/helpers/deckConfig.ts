// NOTE: these utils are for deck configuration!

import {
  DEFAULT_AA_FOR_WASTE_CHUTE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '../constants'
import { getMainAAForAFixture, isFixtureInUsbModules } from '../fixtures'

import type { CutoutFixtureId, CutoutId } from '../../deck'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
} from '../constants'
import type {
  CutoutConfigMap,
  DeckConfiguration,
  DeckDefinition,
  ModuleModel,
} from '../types'

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

export const getWasteChuteOptions = (
  cutoutId: CutoutId
): CutoutConfigMap[][] => {
  if (WASTE_CHUTE_CUTOUT === cutoutId) {
    return [
      [
        {
          cutoutId,
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        },
      ],
      [
        {
          cutoutId,
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        },
      ],
    ]
  } else {
    return []
  }
}

export const mapModuleToCutoutConfig = (
  moduleModel: ModuleModel,
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  addressableAreasById: Record<string, unknown>,
  serialNumber?: string
): CutoutConfigMap[] | null => {
  const keys = Object.keys(addressableAreasById)
  const cutoutFixtureId = keys.find(
    key => key === moduleModel
  ) as CutoutFixtureId

  if (!cutoutFixtureId) return null

  const aaforModule = getMainAAForAFixture(
    cutoutId,
    cutoutFixtureId,
    addressableAreaId
  )

  if (aaforModule === addressableAreaId) return null

  if (!aaforModule) return null

  return [
    {
      cutoutId,
      addressableAreaId: aaforModule,
      cutoutFixtureId,
      opentronsModuleSerialNumber: serialNumber,
    },
  ]
}
