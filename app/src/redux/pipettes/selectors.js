// @flow
import { createSelector } from 'reselect'
import every from 'lodash/every'
import some from 'lodash/some'
import head from 'lodash/head'
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

import {
  getPipettes as getProtocolPipettes,
  getTipracksByMount,
} from '../robot/selectors'

import {
  getPipetteOffsetCalibrations,
  filterCalibrationForPipette,
} from '../calibration/pipette-offset'
import {
  getTipLengthCalibrations,
  filterTipLengthForPipetteAndTiprack,
  tipLengthExistsForPipetteAndTiprack,
} from '../calibration/tip-length'
import type { PipetteOffsetCalibration } from '../calibration/types'
import * as Constants from './constants'
import * as Types from './types'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { State } from '../types'
import type { TipracksByMountMap } from '../robot/types'

import { PIPETTE_MOUNTS } from '../robot/constants'

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

export const getAttachedPipetteCalibrations: (
  state: State,
  robotName: string
) => Types.PipetteCalibrationsByMount = createSelector(
  getAttachedPipettes,
  getPipetteOffsetCalibrations,
  getTipLengthCalibrations,
  (attached, calibrations, tipLengths) => {
    const offsets = {
      left: attached.left
        ? filterCalibrationForPipette(calibrations, attached.left.id, 'left')
        : null,
      right: attached.right
        ? filterCalibrationForPipette(calibrations, attached.right.id, 'right')
        : null,
    }
    return {
      left: {
        offset: offsets.left,
        tipLength: filterTipLengthForPipetteAndTiprack(
          tipLengths,
          attached.left?.id ?? null,
          offsets.left?.tiprack ?? null
        ),
      },
      right: {
        offset: offsets.right,
        tipLength: filterTipLengthForPipetteAndTiprack(
          tipLengths,
          attached.right?.id ?? null,
          offsets.right?.tiprack ?? null
        ),
      },
    }
  }
)

const EMPTY_INFO = {
  actual: null,
  protocol: null,
  compatibility: Constants.MATCH,
  needsOffsetCalibration: false,
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
  _,
  _,
  _
>(
  getAttachedPipettes,
  getProtocolPipettes,
  getPipetteOffsetCalibrations,
  (attachedByMount, protocolPipettes, pipetteOffsetCalibrations) => {
    const pipetteHasOffset = (
      calibrations: Array<PipetteOffsetCalibration>,
      serial: string
    ) => Boolean(head(calibrations.filter(cal => cal.pipette === serial)))
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
          needsOffsetCalibration:
            actualPipette &&
            protocolPipette &&
            actualModelSpecs &&
            compatibility !== Constants.INCOMPATIBLE
              ? !pipetteHasOffset(pipetteOffsetCalibrations, actualPipette.id)
              : false,
        }

        return result
      },
      { [Constants.LEFT]: EMPTY_INFO, [Constants.RIGHT]: EMPTY_INFO }
    )
  }
)

export const getProtocolPipettesMatching: (
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

export const getProtocolPipettesCalibrated: (
  state: State,
  robotName: string
) => boolean = createSelector<State, string, boolean, _>(
  getProtocolPipettesInfo,
  infoByMount => {
    return every(
      infoByMount,
      (info: Types.ProtocolPipetteInfo) => !info.needsOffsetCalibration
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

export const getUncalibratedTipracksByMount: (
  state: State,
  robotName: string
) => TipracksByMountMap = createSelector(
  getProtocolPipettesInfo,
  getTipLengthCalibrations,
  getTipracksByMount,
  (infoByMount, calibrations, tipracksByMount) => {
    return PIPETTE_MOUNTS.reduce<TipracksByMountMap>(
      (result, mount) => {
        const pip = infoByMount?.[mount]
        const pipetteSerial = pip?.actual?.id
        const tipracks = tipracksByMount?.[mount]
        result[mount] =
          Array.isArray(tipracks) && tipracks?.length && pipetteSerial
            ? tipracks.filter(
                tr =>
                  tr.definitionHash &&
                  !tipLengthExistsForPipetteAndTiprack(
                    calibrations,
                    pipetteSerial,
                    tr.definitionHash
                  )
              )
            : []
        return result
      },
      { left: [], right: [] }
    )
  }
)
