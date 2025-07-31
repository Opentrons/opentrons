import { getAddressableAreasInProtocol, getDeckDefFromRobotType } from '.'
import { FLEX_ROBOT_TYPE } from '../constants'
import {
  getAddressableAreaFromSlotId,
  getMainNonComboFixtureId,
} from '../fixtures'

import type { AddressableAreaName, CutoutFixtureId, CutoutId } from '../../deck'
import type { ProtocolAnalysisOutput } from '../../protocol'
import type {
  CompletedProtocolAnalysis,
  CutoutConfig,
  CutoutFixture,
  CutoutFixtureGroup,
  DeckConfiguration,
  DeckDefinition,
} from '../types'

export interface CutoutConfigProtocolSpec extends CutoutConfig {
  requiredAddressableAreas: AddressableAreaName[]
}

export const FLEX_SIMPLEST_DECK_CONFIG: DeckConfiguration = [
  { cutoutId: 'cutoutA1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutB1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutC1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutD1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutA2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutB2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutC2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutD2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutA3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutB3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutC3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutD3', cutoutFixtureId: 'singleRightSlot' },
]

export const FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC: CutoutConfigProtocolSpec[] = FLEX_SIMPLEST_DECK_CONFIG.map(
  config => ({ ...config, requiredAddressableAreas: [] })
)

export function getSimplestDeckConfigForProtocol(
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
): CutoutConfigProtocolSpec[] {
  // TODO(BC, 2023-11-06): abstract out the robot type
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const addressableAreas =
    protocolAnalysis != null
      ? getAddressableAreasInProtocol(protocolAnalysis, deckDef)
      : []
  const simplestDeckConfig = addressableAreas.reduce<
    CutoutConfigProtocolSpec[]
  >((acc, addressableArea) => {
    const cutoutFixturesForAddressableArea = getCutoutFixturesForAddressableAreas(
      [addressableArea],
      deckDef.cutoutFixtures
    )
    const cutoutIdForAddressableArea = getCutoutIdForAddressableArea(
      addressableArea,
      cutoutFixturesForAddressableArea
    )
    console.log('cutoutIdForAddressableArea', cutoutIdForAddressableArea)
    const cutoutFixturesForCutoutId =
      cutoutIdForAddressableArea != null
        ? getCutoutFixturesForCutoutId(
            cutoutIdForAddressableArea,
            deckDef.cutoutFixtures
          )
        : null
    console.log('cutoutFixturesForCutoutId', cutoutFixturesForCutoutId)
    const existingCutoutConfig = acc.find(
      cutoutConfig => cutoutConfig.cutoutId === cutoutIdForAddressableArea
    )
    console.log('existingCutoutConfig', existingCutoutConfig)

    if (
      existingCutoutConfig != null &&
      cutoutFixturesForCutoutId != null &&
      cutoutIdForAddressableArea != null
    ) {
      const indexOfExistingFixture = cutoutFixturesForCutoutId.findIndex(
        ({ id }) => id === existingCutoutConfig.cutoutFixtureId
      )
      const accIndex = acc.findIndex(
        ({ cutoutId }) => cutoutId === cutoutIdForAddressableArea
      )
      const previousRequiredAAs = acc[accIndex]?.requiredAddressableAreas
      console.log('previousRequiredAAs', previousRequiredAAs)
      console.log('addressableArea: ', addressableArea)
      const allNextRequiredAddressableAreas =
        previousRequiredAAs != null &&
        previousRequiredAAs.includes(addressableArea)
          ? previousRequiredAAs
          : [...previousRequiredAAs, addressableArea]
      console.log(
        'allNextRequiredAddressableAreas',
        allNextRequiredAddressableAreas
      )
      const nextCompatibleCutoutFixture = getSimplestFixtureForAddressableAreas(
        cutoutIdForAddressableArea,
        allNextRequiredAddressableAreas,
        cutoutFixturesForCutoutId
      )
      console.log('first', nextCompatibleCutoutFixture)
      const indexOfCurrentFixture = cutoutFixturesForCutoutId.findIndex(
        ({ id }) => id === nextCompatibleCutoutFixture?.id
      )

      if (
        nextCompatibleCutoutFixture != null &&
        indexOfCurrentFixture > indexOfExistingFixture
      ) {
        return [
          ...acc.slice(0, accIndex),
          {
            cutoutId: cutoutIdForAddressableArea,
            cutoutFixtureId: nextCompatibleCutoutFixture.id,
            requiredAddressableAreas: allNextRequiredAddressableAreas,
          },
          ...acc.slice(accIndex + 1),
        ]
      }
    }
    return acc
  }, FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC)
  console.log('simplestDeckConfig', simplestDeckConfig)
  return simplestDeckConfig
}

export function getCutoutFixturesForAddressableAreas(
  addressableAreas: AddressableAreaName[],
  cutoutFixtures: CutoutFixture[]
): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture =>
    Object.values(cutoutFixture.providesAddressableAreas).some(providedAAs =>
      addressableAreas.every(aa => providedAAs.includes(aa))
    )
  )
}

export function getCutoutFixturesForCutoutId(
  cutoutId: CutoutId,
  cutoutFixtures: CutoutFixture[]
): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture =>
    cutoutFixture.mayMountTo.some(mayMountTo => mayMountTo.includes(cutoutId))
  )
}

export function getCutoutIdForSlotName(
  slotName: string,
  deckDef: DeckDefinition
): CutoutId | null {
  const addressableArea = getAddressableAreaFromSlotId(slotName, deckDef)
  const cutoutIdForSlotName =
    addressableArea != null
      ? getCutoutIdForAddressableArea(
          addressableArea.id,
          deckDef.cutoutFixtures
        )
      : null

  return cutoutIdForSlotName
}

export function getFixtureGroupForCutoutFixture(
  cutoutFixtureId: CutoutFixtureId,
  cutoutFixtures: CutoutFixture[]
): CutoutFixtureGroup {
  return (
    cutoutFixtures.find(cf => cf.id === cutoutFixtureId)?.fixtureGroup ?? {}
  )
}

export function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(
        cutoutFixture.providesAddressableAreas
      ).find(([_cutoutId, providedAAs]) =>
        providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}

export function getSimplestFixtureForAddressableAreas(
  cutoutId: CutoutId,
  requiredAddressableAreas: AddressableAreaName[],
  allCutoutFixtures: CutoutFixture[]
): CutoutFixture | null {
  const cutoutFixturesForCutoutId = getCutoutFixturesForCutoutId(
    cutoutId,
    allCutoutFixtures
  )
  const nextCompatibleCutoutFixtures = getCutoutFixturesForAddressableAreas(
    requiredAddressableAreas,
    cutoutFixturesForCutoutId
  )
  console.log('nextCompatibleCutoutFixtures', nextCompatibleCutoutFixtures)
  if (nextCompatibleCutoutFixtures.length > 1) {
    const mainFixture = getMainNonComboFixtureId(
      nextCompatibleCutoutFixtures.map(cf => cf.id),
      requiredAddressableAreas,
      cutoutId
    )
    console.log('mainFixture', mainFixture)
    return (
      nextCompatibleCutoutFixtures.find(cf => cf.id === mainFixture) ?? null
    )
  } else {
    return nextCompatibleCutoutFixtures?.[0] ?? null
  }
}
