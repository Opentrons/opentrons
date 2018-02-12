// @flow
import chunk from 'lodash/chunk'
import cloneDeep from 'lodash/cloneDeep'
import flatMap from 'lodash/flatMap'
import {aspirate, dispense, replaceTip} from './'
import type {ConsolidateFormData, RobotState, Command, CommandReducer} from './'

const consolidate = (data: ConsolidateFormData): CommandReducer => (prevRobotState: RobotState) => {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.

    If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.

    A single uniform volume will be aspirated from every source well.
  */
  let commandReducers: Array<CommandReducer> = []

  const pipetteData = prevRobotState.instruments[data.pipette]
  if (!pipetteData) {
    throw new Error('Consolidate called with pipette that does not exist in robotState, pipette id: ' + data.pipette)
  }
  const disposalVolume = data.disposalVolume || 0
  const maxWellsPerChunk = Math.floor(
    (pipetteData.maxVolume - disposalVolume) / data.volume
  )

  commandReducers = flatMap(
    chunk(data.sourceWells, maxWellsPerChunk),
    (sourceWellChunk: Array<string>, chunkIndex: number): Array<CommandReducer> => {
      const aspirateCommands = sourceWellChunk.map((sourceWell: string, wellIndex: number): CommandReducer => {
        const isFirstWellInChunk = wellIndex === 0
        return aspirate({
          pipette: data.pipette,
          volume: data.volume + (isFirstWellInChunk ? disposalVolume : 0),
          labware: data.sourceLabware,
          well: sourceWell
        })
      })

      let tipCommands: Array<CommandReducer> = []

      if (
        data.changeTip === 'always' ||
        (data.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [replaceTip(data.pipette)]
      }

      return [
        ...tipCommands,
        ...aspirateCommands,
        dispense({
          pipette: data.pipette,
          volume: data.volume * sourceWellChunk.length + disposalVolume,
          labware: data.destLabware,
          well: data.destWell
        })
      ]
    }
  )

  const commandsAndState = commandReducers.reduce(
    (prev, reducerFn) => {
      const next = reducerFn(prev.robotState)
      return {
        robotState: next.robotState,
        commands: [...prev.commands, ...next.commands]
      }
    },
    {robotState: cloneDeep(prevRobotState), commands: []} // TODO: should I clone here (for safety) or is it safe enough?
  )

  return commandsAndState
}

export default consolidate

// return { // TODO: figure out where outside consolidate this annotation happens
//   robotState: robotState,
//   atomicCommands: {
//     annotation: {
//       name: data.name,
//       description: data.description
//     },
//     commands
//   }
// }
