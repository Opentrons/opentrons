// @flow
import { createSelector } from 'reselect'

import * as stepFormSelectors from '../../step-forms/selectors'
import { getLabwareNicknamesById } from '../labware/selectors'
import { getModuleLabwareOptions, getModuleHasLabware } from './utils'
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
    return getModuleLabwareOptions(initialDeckSetup, nicknamesById, 'tempdeck')
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

/** Returns boolean if magnetic module has labware */
export const getMagnetModuleHasLabware: Selector<boolean> = createSelector(
  stepFormSelectors.getInitialDeckSetup,
  initialDeckSetup => {
    return getModuleHasLabware(initialDeckSetup, 'magdeck')
  }
)
