import { AIR_GAP_OFFSET_FROM_TOP } from '../../constants'
import { curryWithoutPython, reduceCommandCreators } from '../../utils'
import { airGapInPlace, moveToWell, prepareToAspirate } from '../atomic'

import type { CommandCreator, CurriedCommandCreator } from '../../types'

export type AirGapInWellType = 'aspirate' | 'dispense'

interface AirGapInWellArgs {
  type: AirGapInWellType
  flowRate: number
  pipetteId: string
  volume: number
  labwareId: string
  wellName: string
}

export const airGapInWell: CommandCreator<AirGapInWellArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { labwareId, wellName, flowRate, pipetteId, volume, type } = args
  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName

  const prepareToAspirateCommand =
    type === 'aspirate'
      ? []
      : [
          curryWithoutPython(prepareToAspirate, {
            pipetteId,
          }),
        ]

  const pythonCommandCreator: CurriedCommandCreator = () => ({
    commands: [],
    python: `${pipettePythonName}.air_gap(${[
      `volume=${volume}`,
      `height=${AIR_GAP_OFFSET_FROM_TOP}`,
      `flow_rate=${flowRate}`,
    ].join(', ')})`,
    // Python air_gap() does not have a way to specify the labwareId+wellName.
    // We expect the previous command to have already moved the pipette to the well.
  })

  const commandCreators = [
    curryWithoutPython(moveToWell, {
      pipetteId,
      labwareId,
      wellName,
      wellLocation: {
        origin: 'top',
        offset: {
          z: AIR_GAP_OFFSET_FROM_TOP,
          x: 0,
          y: 0,
        },
      },
    }),
    ...prepareToAspirateCommand,
    curryWithoutPython(airGapInPlace, {
      pipetteId,
      volume,
      flowRate,
    }),
    pythonCommandCreator,
  ]

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
