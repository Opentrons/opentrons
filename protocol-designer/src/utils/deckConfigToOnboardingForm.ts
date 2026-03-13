/**
 * Converts a deck configuration (from robot API or exported file) into
 * Protocol Designer onboarding form state (modules + fixtures) for Step 2.
 * Used when importing a deck config file on the "Let's start with the basics" step.
 */

import {
  COMBO_FIXTURE_TO_FIXTURE_MAP,
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
  FLEX_ROBOT_TYPE,
  getAAWithFakesFromCutoutFixtureId,
  getDeckDefFromRobotType,
  getModuleModelFromFixtureId,
  getModuleType,
  getSlotDisplayNameFromAAWithFakes,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'
import { uuid } from '@opentrons/step-generation'

import { mapFixtureIdToFixtureName } from '../components/organisms/FlexHardware/util'

import type {
  AddressableAreaNamesWithFakes,
  CutoutConfig,
  CutoutFixtureIdsWithFakes,
  FlexModuleCutoutFixtureId,
} from '@opentrons/shared-data'
import type { Fixtures } from '../components/organisms'
import type { FormModule, FormModules } from '../step-forms'

export const DECK_CONFIG_IMPORT_VERSION = 1

export interface DeckConfigExportPipette {
  mount: 'left' | 'right'
  instrumentName: string
}

export interface DeckConfigExportPayload {
  version?: number
  deckConfiguration: DeckConfiguration
  pipettes?: DeckConfigExportPipette[]
}

/**
 * Extract pipettes array from a parsed deck config file payload.
 * Returns undefined if payload is not an object or has no valid pipettes array.
 */
export function getPipettesFromDeckConfigPayload(
  parsed: unknown
): DeckConfigExportPipette[] | undefined {
  if (parsed == null || typeof parsed !== 'object') return undefined
  const raw = (parsed as Record<string, unknown>).pipettes
  if (!Array.isArray(raw)) return undefined
  const result: DeckConfigExportPipette[] = []
  for (const item of raw) {
    if (
      item != null &&
      typeof item === 'object' &&
      'mount' in item &&
      'instrumentName' in item &&
      (item.mount === 'left' || item.mount === 'right') &&
      typeof item.instrumentName === 'string' &&
      item.instrumentName.length > 0
    ) {
      result.push({
        mount: item.mount,
        instrumentName: item.instrumentName,
      })
    }
  }
  return result.length > 0 ? result : undefined
}

/**
 * Normalize parsed JSON to a DeckConfiguration array.
 * Accepts either the wrapped format { version, deckConfiguration } or a raw array.
 */
export function parseDeckConfigFilePayload(
  parsed: unknown
): DeckConfiguration | null {
  if (Array.isArray(parsed)) {
    return isValidDeckConfig(parsed) ? parsed : null
  }
  if (
    parsed != null &&
    typeof parsed === 'object' &&
    'deckConfiguration' in parsed
  ) {
    const config = (parsed as DeckConfigExportPayload).deckConfiguration
    return Array.isArray(config) && isValidDeckConfig(config) ? config : null
  }
  return null
}

function isValidDeckConfig(arr: unknown[]): arr is DeckConfiguration {
  return arr.every(
    (item): item is CutoutConfig =>
      item != null &&
      typeof item === 'object' &&
      'cutoutId' in item &&
      'cutoutFixtureId' in item &&
      typeof (item as CutoutConfig).cutoutId === 'string' &&
      typeof (item as CutoutConfig).cutoutFixtureId === 'string'
  )
}

export interface DeckConfigToFormResult {
  modules: FormModules
  fixtures: Fixtures
  hasWasteChute: boolean
  hasThermocycler: boolean
}

/**
 * Convert robot/export deck configuration into onboarding form modules and fixtures.
 * Only supports Flex; thermocycler rear cutout is skipped (front defines the module).
 */
export function deckConfigToOnboardingForm(
  deckConfig: DeckConfiguration
): DeckConfigToFormResult {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const modules: FormModules = {}
  const fixtures: Fixtures = {}
  let moduleIndex = 0
  let hasWasteChute = false
  let hasThermocycler = false

  for (const entry of deckConfig) {
    const { cutoutId, cutoutFixtureId } = entry
    const fixtureIdsToProcess: CutoutFixtureIdsWithFakes[] =
      COMBO_FIXTURE_TO_FIXTURE_MAP[cutoutFixtureId as CutoutFixtureId] ?? [
        cutoutFixtureId as CutoutFixtureId,
      ]

    for (const fid of fixtureIdsToProcess) {
      const model = getModuleModelFromFixtureId(fid as CutoutFixtureId)
      if (model != null) {
        if (fid === THERMOCYCLER_V2_REAR_FIXTURE) continue
        const slotFromFixture = getSlotForCutoutFixture(
          cutoutId as CutoutId,
          fid as CutoutFixtureId,
          deckDef
        )
        if (slotFromFixture == null) continue
        if (getModuleType(model) === THERMOCYCLER_MODULE_TYPE) {
          hasThermocycler = true
        }
        // Use display slots (e.g. D1, A4, B1) to match manual deck setup
        const slot =
          getModuleType(model) === THERMOCYCLER_MODULE_TYPE
            ? 'B1'
            : getSlotDisplayNameFromAAWithFakes(
                slotFromFixture as AddressableAreaNamesWithFakes
              )
        modules[moduleIndex] = {
          model,
          type: getModuleType(model),
          slot,
          cutoutFixtureId: fid as FlexModuleCutoutFixtureId,
          cutoutId: cutoutId as CutoutId,
        }
        moduleIndex += 1
      } else {
        const fixtureName = mapFixtureIdToFixtureName(fid as CutoutFixtureId)
        if (fixtureName != null) {
          if (fixtureName === 'wasteChute') hasWasteChute = true
          fixtures[uuid()] = {
            cutoutId: cutoutId as CutoutId,
            name: fixtureName as 'wasteChute' | 'trashBin' | 'stagingArea',
            cutoutFixtureId: fid as CutoutFixtureId,
          }
        }
      }
    }
  }

  return {
    modules,
    fixtures,
    hasWasteChute,
    hasThermocycler,
  }
}

function getSlotForCutoutFixture(
  cutoutId: CutoutId,
  cutoutFixtureId: CutoutFixtureId,
  deckDef: ReturnType<typeof getDeckDefFromRobotType>
): string | null {
  const aas = getAAWithFakesFromCutoutFixtureId(
    cutoutId,
    cutoutFixtureId,
    deckDef
  )
  return aas != null && aas.length > 0 ? aas[0] : null
}
