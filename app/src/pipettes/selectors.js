// @flow
import { createSelector } from 'reselect'
import every from 'lodash/every'
import some from 'lodash/some'
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

import { getPipettes as getProtocolPipettes } from '../robot/selectors'
import * as Constants from './constants'
import * as Types from './types'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { State } from '../types'

const getPipettesState = (state: State) => state.pipettes

export const getAttachedPipettes = (
  state: State,
  robotName: string
): Types.AttachedPipettesByMount => {
  return (
    getPipettesState(state)[robotName]?.attachedByMount || {
      left: null,
      right: null,
    }
  )
}

const EMPTY_INFO = {
  actual: null,
  protocol: null,
  compatibility: Constants.MATCH,
}

const pipettesAreInexactMatch = (
  protocolInstrName: string | null,
  actualModelSpecs: ?PipetteModelSpecs
) => {
  const { backCompatNames } = actualModelSpecs || {}
  return backCompatNames && backCompatNames.includes(protocolInstrName)
}

export const getProtocolPipettesInfo: (
  state: State,
  robotName: string
) => Types.ProtocolPipetteInfoByMount = createSelector<
  State,
  string,
  Types.ProtocolPipetteInfoByMount,
  _,
  _
>(
  getAttachedPipettes,
  getProtocolPipettes,
  (attachedByMount, protocolPipettes) => {
    return Constants.PIPETTE_MOUNTS.reduce(
      (result, mount) => {
        const protocolPipette = protocolPipettes.find(i => i.mount === mount)
        const actualPipette = attachedByMount[mount]
        const requestedAs = protocolPipette?.requestedAs

        const actualModelSpecs = getPipetteModelSpecs(
          actualPipette?.model || ''
        )
        const requestedDisplayName = requestedAs
          ? getPipetteNameSpecs(requestedAs)?.displayName
          : protocolPipette?.modelSpecs?.displayName

        const protocolPipetteName =
          requestedAs || protocolPipette?.modelSpecs?.name || null
        const actualPipetteName = actualModelSpecs?.name || null
        const perfectMatch = protocolPipetteName === actualPipetteName
        let compatibility: Types.PipetteCompatibility = Constants.INCOMPATIBLE

        if (protocolPipette == null || perfectMatch) {
          compatibility = Constants.MATCH
        } else if (
          pipettesAreInexactMatch(protocolPipetteName, actualModelSpecs)
        ) {
          compatibility = Constants.INEXACT_MATCH
        }

        return {
          ...result,
          [mount]: {
            compatibility,
            protocol: protocolPipette
              ? {
                  ...protocolPipette,
                  displayName: requestedDisplayName || protocolPipette.name,
                }
              : null,
            actual:
              actualPipette && actualModelSpecs
                ? {
                    ...actualPipette,
                    modelSpecs: actualModelSpecs,
                    displayName: actualModelSpecs.displayName,
                  }
                : null,
          },
        }
      },
      { [Constants.LEFT]: EMPTY_INFO, [Constants.RIGHT]: EMPTY_INFO }
    )
  }
)

export const getProtocolPipettesMatch: (
  state: State,
  robotName: string
) => boolean = createSelector<State, string, boolean, _>(
  getProtocolPipettesInfo,
  infoByMount => {
    return every(
      infoByMount,
      (info: Types.ProtocolPipetteInfo) =>
        info.compatibility !== Constants.INCOMPATIBLE
    )
  }
)

export const getSomeProtocolPipettesInexact: (
  state: State,
  robotName: string
) => boolean = createSelector<State, string, boolean, _>(
  getProtocolPipettesInfo,
  infoByMount => {
    return some(
      infoByMount,
      info => info.compatibility === Constants.INEXACT_MATCH
    )
  }
)
