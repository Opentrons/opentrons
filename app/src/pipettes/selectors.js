// @flow
import { createSelector } from 'reselect'
import every from 'lodash/every'
import some from 'lodash/some'
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import { getPipettes as getProtocolPipettes } from '../robot/selectors'
import type { State } from '../types'
import * as Constants from './constants'
import * as Types from './types'

export const getAttachedPipettes: (
  state: State,
  robotName: string | null
) => Types.AttachedPipettesByMount = createSelector(
  (state, robotName) =>
    robotName ? state.pipettes[robotName]?.attachedByMount : null,
  attachedByMount => {
    return Constants.PIPETTE_MOUNTS.reduce<Types.AttachedPipettesByMount>(
      (result, mount) => {
        const attached = attachedByMount?.[mount] || null
        const modelSpecs =
          attached && attached.model
            ? getPipetteModelSpecs(attached.model)
            : null

        if (attached && attached.model && modelSpecs) {
          result[mount] = { ...attached, modelSpecs }
        }

        return result
      },
      { left: null, right: null }
    )
  }
)

export const getAttachedPipetteSettings: (
  state: State,
  robotName: string | null
) => Types.PipetteSettingsByMount = createSelector(
  getAttachedPipettes,
  (state, robotName) =>
    robotName ? state.pipettes[robotName]?.settingsById : null,
  (attachedByMount, settingsById) => {
    return Constants.PIPETTE_MOUNTS.reduce<Types.PipetteSettingsByMount>(
      (result, mount) => {
        const attached = attachedByMount[mount]
        const settings = attached ? settingsById?.[attached.id] : null
        const fields = settings?.fields || null

        if (fields) result[mount] = fields
        return result
      },
      { left: null, right: null }
    )
  }
)

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

// TODO(mc, 2019-12-10): possibly use getConnectedRobot selector rather than robotName
export const getProtocolPipettesInfo: (
  state: State,
  robotName: string | null
) => Types.ProtocolPipetteInfoByMount = createSelector<
  State,
  string | null,
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

        const actualModelSpecs = actualPipette?.modelSpecs
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

        result[mount] = {
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
        }

        return result
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
