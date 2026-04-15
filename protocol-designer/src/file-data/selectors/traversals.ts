import { createSelector } from 'reselect'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import {
  enrichRobotStateForStackGraphTraversals,
  getAllLargestStacks,
  getAllProvidedAddressableAreasFromDeckConfig as getAllProvidedAddressableAreasFromDeckConfigUtil,
  getProvidedAddressableAreasExposed,
} from '@opentrons/step-generation'

import { selectors as stepFormSelectors } from '../../step-forms'
import { getInitialRobotState } from './commands'
import { getRobotType } from './fileFields'

import type {
  AddressableAreaName,
  LoadedLabwareLocation,
} from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'
import type { Selector } from '../../types'

/** Initial-deck robot state with `stackedOnNode` (and sibling `contains` when applicable) for traversals. */
export const getRobotStateEnrichedForStackGraphFromRobotState: Selector<RobotState> =
  createSelector(
    getInitialRobotState,
    stepFormSelectors.getModuleEntities,
    stepFormSelectors.getLabwareEntities,
    (robotState, moduleEntities, labwareEntities) =>
      enrichRobotStateForStackGraphTraversals(
        robotState,
        moduleEntities,
        labwareEntities
      )
  )

/** All largest `LoadedLabwareLocation` stacks on the initial deck. */
export const getAllLargestStacksForInitialRobotState: Selector<
  LoadedLabwareLocation[][]
> = createSelector(
  getRobotStateEnrichedForStackGraphFromRobotState,
  robotState => getAllLargestStacks(robotState)
)

/** Addressable areas provided by the current deck fixture configuration. */
export const getAllProvidedAddressableAreasFromDeckConfig: Selector<
  Set<AddressableAreaName>
> = createSelector(
  getRobotType,
  stepFormSelectors.getDeckConfiguration,
  (robotType, deckConfigurationState) =>
    getAllProvidedAddressableAreasFromDeckConfigUtil({
      deckConfiguration: deckConfigurationState.deckConfig,
      deckDefinition: getDeckDefFromRobotType(robotType),
    })
)

/**
 * Provided addressable areas not covered by a labware stack on the initial deck.
 */
export const getProvidedAddressableAreasExposedForRobotState: Selector<
  Set<AddressableAreaName>
> = createSelector(
  getRobotStateEnrichedForStackGraphFromRobotState,
  getRobotType,
  stepFormSelectors.getDeckConfiguration,
  stepFormSelectors.getModuleEntities,
  (robotState, robotType, deckConfigurationState, moduleEntities) =>
    getProvidedAddressableAreasExposed({
      robotState,
      deckConfiguration: deckConfigurationState.deckConfig,
      deckDefinition: getDeckDefFromRobotType(robotType),
      moduleEntities,
    })
)
