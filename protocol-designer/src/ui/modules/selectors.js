// @flow
import { createSelector } from 'reselect'

import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getModuleLabwareOptions,
  getModuleOnDeckByType,
  getModuleHasLabware,
} from './utils'
import { getLabwareNicknamesById } from '../labware/selectors'
import type { Options } from '@opentrons/components'
import type { Selector } from '../../types'

/** Returns dropdown option for labware placed on magnetic module */
export const getMagneticLabwareOptions: Selector<Options> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  getLabwareNicknamesById,
  (initialDeckSetup, nicknamesById) => {
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'magdeck')
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
      'tempdeck'
    )
    const thermocyclerModuleOptions = getModuleLabwareOptions(
      initialDeckSetup,
      nicknamesById,
      'thermocycler'
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
      'thermocycler'
    )
  }
)

/** Get single magnetic module (assumes no multiples) */
export const getSingleMagneticModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, 'magdeck')?.id || null
)

/** Get single temperature module (assumes no multiples) */
export const getSingleTemperatureModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, 'tempdeck')?.id || null
)

/** Get single temperature module (assumes no multiples) */
export const getSingleThermocyclerModuleId: Selector<
  string | null
> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup =>
    getModuleOnDeckByType(initialDeckSetup, 'thermocycler')?.id || null
)

/** Returns boolean if magnetic module has labware */
export const getMagnetModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, 'magdeck')
  }
)

/** Returns boolean if temperature module has labware */
export const getTemperatureModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, 'tempdeck')
  }
)

/** Returns boolean if thermocycler module has labware */
export const getThermocyclerModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, 'thermocycler')
  }
)
