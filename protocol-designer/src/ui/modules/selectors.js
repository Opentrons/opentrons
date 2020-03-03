// @flow
import { createSelector } from 'reselect'
import {
  getLabwareDisplayName,
  getLabwareDefaultEngageHeight,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import mapValues from 'lodash/mapValues'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getLabwareNicknamesById } from '../labware/selectors'
import {
  getModuleLabwareOptions,
  getLabwareOnModule,
  getModuleOnDeckByType,
  getModuleHasLabware,
} from './utils'
import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'

export const getLabwareNamesByModuleId: Selector<{
  [moduleId: string]: ?{ nickname: ?string, displayName: string },
}> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) =>
    mapValues(initialDeckSetup.modules, (module, moduleId) => {
      const labware = getLabwareOnModule(initialDeckSetup, moduleId)
      return labware
        ? {
            nickname: nicknamesById[labware.id],
            displayName: getLabwareDisplayName(labware.def),
          }
        : null
    })
)

/** Returns dropdown option for labware placed on magnetic module */
export const getMagneticLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      MAGNETIC_MODULE_TYPE
    )
  }
)

/** Returns dropdown option for labware placed on temperature module */
export const getTemperatureLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    const temperatureModuleOptions = getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      TEMPERATURE_MODULE_TYPE
    )
    const thermocyclerModuleOptions = getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      THERMOCYCLER_MODULE_TYPE
    )
    return temperatureModuleOptions.concat(thermocyclerModuleOptions)
  }
)

/** Returns dropdown option for labware placed on thermocycler module */
export const getThermocyclerLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      THERMOCYCLER_MODULE_TYPE
    )
  }
)

/** Get single magnetic module (assumes no multiples) */
export const getSingleMagneticModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, MAGNETIC_MODULE_TYPE)?.id || null
)

/** Get single temperature module (assumes no multiples) */
export const getSingleTemperatureModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, TEMPERATURE_MODULE_TYPE)?.id || null
)

/** Get single temperature module (assumes no multiples) */
export const getSingleThermocyclerModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, THERMOCYCLER_MODULE_TYPE)?.id ||
    null
)

/** Returns boolean if magnetic module has labware */
export const getMagnetModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, MAGNETIC_MODULE_TYPE)
  }
)

/** Returns boolean if temperature module has labware */
export const getTemperatureModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, TEMPERATURE_MODULE_TYPE)
  }
)

/** Returns boolean if thermocycler module has labware */
export const getThermocyclerModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, THERMOCYCLER_MODULE_TYPE)
  }
)

export const getMagnetLabwareEngageHeight: Selector<
  number | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getSingleMagneticModuleId,
  (initialDeckSetup, magnetModuleId) => {
    const labware =
      magnetModuleId && getLabwareOnModule(initialDeckSetup, magnetModuleId)
    return (labware && getLabwareDefaultEngageHeight(labware.def)) || null
  }
)

/** Returns boolean if TC or Temperature Modules are present on deck  */
export const getTempModuleOrThermocyclerIsOnDeck: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    const tempOnDeck = getModuleOnDeckByType(
      initialDeckSetup,
      THERMOCYCLER_MODULE_TYPE
    )
    const tcOnDeck = getModuleOnDeckByType(
      initialDeckSetup,
      TEMPERATURE_MODULE_TYPE
    )
    return Boolean(tempOnDeck || tcOnDeck)
  }
)
