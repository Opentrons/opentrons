import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { DispenseInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

interface DispenseInPlaceAtomicParams extends DispenseInPlaceParams {
  isAirGap?: boolean // used to subtract volume from liquid state & substep details
}

export const dispenseInPlace: CommandCreator<DispenseInPlaceAtomicParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    pipetteId,
    volume,
    flowRate,
    pushOut,
    correctionVolume,
    isAirGap,
  } = args

  const errors: CommandCreatorError[] = []
  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'dispense',
        pipette: pipetteId,
      })
    )
  }

  const commands = [
    {
      commandType: 'dispenseInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
        ...(pushOut != null ? { pushOut } : {}),
        ...(correctionVolume != null ? { correctionVolume } : {}),
      },
      ...(isAirGap ? { meta: { isAirGap } } : {}),
    },
  ]
  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const pythonArgs = [
    `volume=${volume}`,
    `flow_rate=${flowRate}`,
    ...(pushOut != null ? [`push_out=${pushOut}`] : []),
    // Note that correction volume is not supported in our public atomic liquid handling APIs
  ]
  const python = `${pipettePythonName}.dispense(${pythonArgs.join(', ')})`

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  return {
    commands,
    python,
  }
}
