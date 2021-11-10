import { useSelector } from 'react-redux'
import { getLabwareDefURI } from '@opentrons/shared-data'
import {
  getAttachedPipetteCalibrations,
  getAttachedPipettes,
  PIPETTE_MOUNTS,
  INEXACT_MATCH,
  MATCH
} from '../../../../redux/pipettes'
import { getConnectedRobotName } from '../../../../redux/robot/selectors'
import { getTipLengthCalibrations } from '../../../../redux/calibration/tip-length'

import type { State } from '../../../../redux/types'

export function useCalDataByMount(): unknown {
  const robotName =  useSelector((state: State) => getConnectedRobotName(state))
  const attachedPipettes = useSelector((state: State) => getAttachedPipettes(state, robotName))
  const attachedPipetteCalibrations = useSelector((state: State) => getAttachedPipetteCalibrations(state, robotName))
  const tipLengthCalibration = useSelector((state: State) => getTipLengthCalibrations(state, robotName))

    return PIPETTE_MOUNTS.reduce<Types.ProtocolPipetteTipRackCalDataByMount>(
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
            protocolPipetteMatch[mount] === INEXACT_MATCH ||
            protocolPipetteMatch[mount] === MATCH
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
              tipRackDef: tipRackDef,
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


