// @flow
import {createSelector} from 'reselect'
import startCase from 'lodash/startCase'
import reduce from 'lodash/reduce'
import get from 'lodash/get'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import {getAllPipetteNames, getPipetteNameSpecs, getLabware} from '@opentrons/shared-data'

import type {DropdownOption} from '@opentrons/components'
import type {PipetteData} from '../step-generation'
import type {RootState} from './reducers'
import type {FormattedPipette} from './types'

type PipettesById = {[pipetteId: string]: PipetteData}
type RootSlice = {pipettes: RootState}

type Selector<T> = (RootSlice) => T

export const rootSelector = (state: {pipettes: RootState}) => state.pipettes

export const pipettesById: Selector<PipettesById> = createSelector(
  rootSelector,
  pipettes => pipettes.byId
)

export const pipetteIdsByMount: Selector<*> = createSelector(
  rootSelector,
  pipettes => pipettes.byMount
)

export const pipettesByMount: Selector<*> = createSelector(
  rootSelector,
  pipettes => mapValues(pipettes.byMount, id => pipettes.byId[id])
)

function _getPipetteName (pipetteData): string {
  const result = getAllPipetteNames().find(pipetteModel => {
    const p = getPipetteNameSpecs(pipetteModel)
    return p && (
      p.channels === pipetteData.channels &&
      p.maxVolume === pipetteData.maxVolume
    )
  })
  if (!result) {
    console.error('_getPipetteName: No name found for given pipette')
    return '???'
  }
  const pipette = getPipetteNameSpecs(result)
  return pipette ? pipette.displayName : '???'
}

// Shows equipped (left & right) pipettes by ID, not mount
export const equippedPipettes: Selector<PipettesById> = createSelector(
  rootSelector,
  pipettes => reduce(pipettes.byMount, (acc: PipettesById, pipetteId: string): PipettesById => {
    const pipetteData = pipettes.byId[pipetteId]
    if (!pipetteData) return acc
    return {
      ...acc,
      [pipetteId]: pipetteData,
    }
  }, {})
)

export const equippedPipetteOptions: Selector<Array<DropdownOption>> = createSelector(
  equippedPipettes,
  (pipettesById: PipettesById) => {
    const pipetteIds = Object.keys(pipettesById)
    const pipetteNamesById = pipetteIds.reduce((acc: {[string]: string}, pipetteId: string) => {
      const pipetteData = pipettesById[pipetteId]
      if (!pipetteData) return acc
      return {
        ...acc,
        [pipetteId]: _getPipetteName(pipetteData),
      }
    }, {})

    const namesAreAmbiguous = (
      uniq(Object.values(pipetteNamesById)).length !==
      Object.values(pipetteNamesById).length)

    return pipetteIds.reduce((acc: Array<DropdownOption>, pipetteId: string): Array<DropdownOption> => {
      const pipetteData = pipettesById[pipetteId]
      if (!pipetteData) return acc
      const pipetteName = pipetteNamesById[pipetteId]

      return [
        ...acc,
        {
          name: (namesAreAmbiguous)
            ? `${pipetteName} (${startCase(pipetteData.mount)})`
            : pipetteName,
          value: pipetteId,
        },
      ]
    }, [])
  }
)

// Formats pipette data specifically for edit pipette
export const pipettesForInstrumentGroup: Selector<*> = createSelector(
  rootSelector,
  pipettes => [pipettes.byMount.left, pipettes.byMount.right].reduce((acc, pipetteId) => {
    if (!pipetteId) return acc

    const pipetteData = pipettes.byId[pipetteId]

    if (!pipetteData) return acc

    const tipVolume = pipetteData.tiprackModel && get(getLabware(pipetteData.tiprackModel), 'metadata.tipVolume')

    const pipetteForInstrumentGroup = {
      ...pipetteData,
      description: _getPipetteName(pipetteData),
      isDisabled: false,
      tiprackModel: tipVolume && `${tipVolume} µl`, // TODO: BC 2018-07-23 tiprack displayName
      tiprack: {model: pipetteData.tiprackModel}, // TODO: BC 2018-10-22-3 consolidate with tiprackModel above
    }

    return [...acc, pipetteForInstrumentGroup]
  }, [])
)

// Formats pipette data specifically for edit pipette
export const pipettesForEditPipettes: Selector<Array<FormattedPipette>> = createSelector(
  rootSelector,
  pipettes => [pipettes.byMount.left, pipettes.byMount.right].reduce((acc, pipetteId) => {
    if (!pipetteId) return acc

    const pipetteData = pipettes.byId[pipetteId]

    if (!pipetteData) return acc

    const tipVolume = pipetteData.tiprackModel && get(getLabware(pipetteData.tiprackModel), 'metadata.tipVolume')

    const pipetteForInstrumentGroup = {
      ...pipetteData,
      description: _getPipetteName(pipetteData),
      isDisabled: false,
      tiprackModel: tipVolume && `${tipVolume} µl`, // TODO: BC 2018-07-23 tiprack displayName
      tiprack: {model: pipetteData.tiprackModel}, // TODO: BC 2018-10-22-3 consolidate with tiprackModel above
    }

    return [...acc, pipetteForInstrumentGroup]
  }, [])
)

export const permittedTipracks: Selector<Array<string>> = createSelector(
  equippedPipettes,
  (_equippedPipettes) =>
    reduce(_equippedPipettes, (acc: Array<string>, pipette: PipetteData) => {
      return (pipette.tiprackModel)
        ? [...acc, pipette.tiprackModel]
        : acc
    }, [])
)
