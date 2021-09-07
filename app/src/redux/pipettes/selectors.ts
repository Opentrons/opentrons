import { createSelector } from 'reselect'
import every from 'lodash/every'
import some from 'lodash/some'
import head from 'lodash/head'
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
  getLabwareDefURI,
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
import { getProtocolPipetteTipRacks } from '../protocol'
import { PIPETTE_MOUNTS } from '../robot/constants'
import * as Constants from './constants'

import * as Types from './types'
import type { PipetteOffsetCalibration } from '../calibration/types'
import type {
  PipetteModelSpecs,
  PipetteName,
  PipetteModel,
} from '@opentrons/shared-data'
import type { State } from '../types'
import type { TipracksByMountMap } from '../robot/types'

export const getAttachedPipettes: (
  state: State,
  robotName: string | null
) => Types.AttachedPipettesByMount = createSelector(
  (state: State, robotName: string | null) =>
    robotName ? state.pipettes[robotName]?.attachedByMount : null,
  attachedByMount => {
    return Constants.PIPETTE_MOUNTS.reduce<Types.AttachedPipettesByMount>(
      (result, mount) => {
        const attached = attachedByMount?.[mount] || null
        const modelSpecs =
          attached && attached.model
            ? getPipetteModelSpecs(attached.model as PipetteModel)
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
  actualModelSpecs: PipetteModelSpecs | null | undefined
): boolean => {
  const { backCompatNames } = actualModelSpecs || {}
  // @ts-expect-error TODO: protect against protocolInstrName === null case
  return Boolean(backCompatNames && backCompatNames.includes(protocolInstrName))
}

// TODO(mc, 2019-12-10): possibly use getConnectedRobot selector rather than robotName
export const getProtocolPipettesInfo: (
  state: State,
  robotName: string | null
) => Types.ProtocolPipetteInfoByMount = createSelector(
  getAttachedPipettes,
  getProtocolPipettes,
  getPipetteOffsetCalibrations,
  (attachedByMount, protocolPipettes, pipetteOffsetCalibrations) => {
    const pipetteHasOffset = (
      calibrations: PipetteOffsetCalibration[],
      serial: string
    ): boolean => {
      return Boolean(head(calibrations.filter(cal => cal.pipette === serial)))
    }
    return Constants.PIPETTE_MOUNTS.reduce<Types.ProtocolPipetteInfoByMount>(
      (result, mount) => {
        const protocolPipette = protocolPipettes.find(i => i.mount === mount)
        const actualPipette = attachedByMount[mount]
        const requestedAs = protocolPipette?.requestedAs

        const actualModelSpecs = actualPipette?.modelSpecs
        const requestedDisplayName = requestedAs
          ? getPipetteNameSpecs(requestedAs as PipetteName)?.displayName
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
) => boolean = createSelector(getProtocolPipettesInfo, infoByMount => {
  return every(
    infoByMount,
    (info: Types.ProtocolPipetteInfo) =>
      info.compatibility !== Constants.INCOMPATIBLE
  )
})

export const getProtocolPipettesCalibrated: (
  state: State,
  robotName: string
) => boolean = createSelector(getProtocolPipettesInfo, infoByMount => {
  return every(
    infoByMount,
    (info: Types.ProtocolPipetteInfo) => !info.needsOffsetCalibration
  )
})

export const getSomeProtocolPipettesInexact: (
  state: State,
  robotName: string
) => boolean = createSelector(getProtocolPipettesInfo, infoByMount => {
  return some(
    infoByMount,
    info => info.compatibility === Constants.INEXACT_MATCH
  )
})

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

export const getProtocolPipettesMatch: (
  state: State,
  robotName: string
) => Types.ProtocolPipettesMatchByMount = createSelector(
  getAttachedPipettes,
  getProtocolPipetteTipRacks,
  (attachedPipettes, protocolPipetteTipRack) => {
    return Constants.PIPETTE_MOUNTS.reduce<Types.ProtocolPipettesMatchByMount>(
      (result, mount) => {
        const attachedPipette = attachedPipettes[mount]
        const protocolPipette = protocolPipetteTipRack[mount]
        if (
          attachedPipette == null ||
          protocolPipette == null ||
          protocolPipette.pipetteSpecs == null
        ) {
          result[mount] = null
        } else {
          if (
            pipettesAreInexactMatch(
              protocolPipette.pipetteSpecs.name,
              attachedPipette?.modelSpecs
            )
          ) {
            result[mount] = Constants.INEXACT_MATCH
          } else if (
            protocolPipette.pipetteSpecs.name ===
            attachedPipette.modelSpecs.name
          ) {
            result[mount] = Constants.MATCH
          } else {
            result[mount] = Constants.INCOMPATIBLE
          }
        }
        return result
      },
      { left: null, right: null }
    )
  }
)

export const getProtocolPipetteTipRackCalInfo: (
  state: State,
  robotName: string
) => Types.ProtocolPipetteTipRackCalDataByMount = createSelector(
  getProtocolPipetteTipRacks,
  getProtocolPipettesMatch,
  getAttachedPipettes,
  getAttachedPipetteCalibrations,
  getTipLengthCalibrations,
  (
    protocolPipetteTipracks,
    protocolPipetteMatch,
    attachedPipettes,
    attachedPipetteCalibrations,
    tipLengthCalibrations
  ) => {
    return Constants.PIPETTE_MOUNTS.reduce<Types.ProtocolPipetteTipRackCalDataByMount>(
      (result, mount) => {
        const protocolPipetteTiprack = protocolPipetteTipracks[mount]
        const attachedPipette = attachedPipettes[mount]
        if (
          protocolPipetteTiprack == null ||
          protocolPipetteTiprack.pipetteSpecs == null
        ) {
          result[mount] = null
        } else {
          const pipettesMatch =
            protocolPipetteMatch[mount] === Constants.INEXACT_MATCH ||
            protocolPipetteMatch[mount] === Constants.MATCH
          const pipetteLastCalDate = pipettesMatch
            ? attachedPipetteCalibrations[mount].offset?.lastModified
            : null
          const tipRackCalData = new Array<Types.TipRackCalibrationData>()
          protocolPipetteTiprack.tipRackDefs.forEach(tipRackDef => {
            let lastTiprackCalDate = null
            const tipRackMatch = tipLengthCalibrations.find(
              tipRack => tipRack.uri === getLabwareDefURI(tipRackDef)
            )
            lastTiprackCalDate =
              attachedPipette !== null &&
              tipRackMatch?.pipette === attachedPipette.id &&
              pipettesMatch
                ? tipRackMatch.lastModified
                : null

            tipRackCalData.push({
              displayName: tipRackDef.metadata.displayName,
              lastModifiedDate: lastTiprackCalDate,
            })
          })
          result[mount] = {
            pipetteDisplayName:
              protocolPipetteTiprack.pipetteSpecs?.displayName,
            exactPipetteMatch: protocolPipetteMatch[mount],
            pipetteCalDate: pipetteLastCalDate,
            tipRacks: tipRackCalData,
          }
        }
        return result
      },
      { left: null, right: null }
    )
  }
)
