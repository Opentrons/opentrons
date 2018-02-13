// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import {aspirate, dispense, blowout, replaceTip, repeatArray, reduceCommandCreators} from './'
import type {ConsolidateFormData, RobotState, CommandCreator} from './'

const consolidate = (data: ConsolidateFormData): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.

    If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.

    A single uniform volume will be aspirated from every source well.
  */
  let CommandCreators: Array<CommandCreator> = []

  const pipetteData = prevRobotState.instruments[data.pipette]
  if (!pipetteData) {
    throw new Error('Consolidate called with pipette that does not exist in robotState, pipette id: ' + data.pipette) // TODO test
  }

  // TODO error on negative data.disposalVolume?
  const disposalVolume = (data.disposalVolume && data.disposalVolume > 0)
    ? data.disposalVolume
    : 0

  const maxWellsPerChunk = Math.floor(
    (pipetteData.maxVolume - disposalVolume) / data.volume
  )

  CommandCreators = flatMap(
    chunk(data.sourceWells, maxWellsPerChunk),
    (sourceWellChunk: Array<string>, chunkIndex: number): Array<CommandCreator> => {
      // Aspirate commands for all source wells in the chunk
      const aspirateCommands = sourceWellChunk.map((sourceWell: string, wellIndex: number): CommandCreator => {
        const isFirstWellInChunk = wellIndex === 0
        return aspirate({
          pipette: data.pipette,
          volume: data.volume + (isFirstWellInChunk ? disposalVolume : 0),
          labware: data.sourceLabware,
          well: sourceWell
        })
      })

      let tipCommands: Array<CommandCreator> = []

      if (
        data.changeTip === 'always' ||
        (data.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [replaceTip(data.pipette)]
      }

      const trashTheDisposalVol = disposalVolume
        ? [
          blowout({
            pipette: data.pipette,
            labware: 'trashId', // TODO trash ID should be a constant
            well: 'A1'
          })
        ]
        : []

      // TODO factor out createMix helper fn
      function createMix (pipette: string, labware: string, well: string, volume: number, times: number) {
        return repeatArray([
          aspirate({
            pipette,
            volume,
            labware,
            well
          }),
          dispense({
            pipette,
            volume,
            labware,
            well
          })
        ], times)
      }

      const mixBeforeCommands = (data.mixFirstAspirate)
        ? createMix(
          data.pipette,
          data.sourceLabware,
          sourceWellChunk[0],
          data.mixFirstAspirate.volume,
          data.mixFirstAspirate.times
        )
        : []

      const preWetTipCommands = (data.preWetTip)
        // Pre-wet tip is equivalent to a single mix, with volume equal to the consolidate volume.
        ? createMix(
          data.pipette,
          data.sourceLabware,
          sourceWellChunk[0],
          data.volume,
          1
        )
        : []

      const mixAfterCommands = (data.mixInDestination)
        ? createMix(
          data.pipette,
          data.destLabware,
          data.destWell,
          data.mixInDestination.volume,
          data.mixInDestination.times
        )
        : []

      const blowoutCommand = (data.blowout)
        ? [
          blowout({
            pipette: data.pipette,
            labware: data.blowout,
            well: 'A1' // TODO LATER: should user be able to specify the blowout well?
          })
        ]
        : []

      return [
        ...tipCommands,
        ...mixBeforeCommands,
        ...preWetTipCommands, // NOTE when you both mix-before and pre-wet tip, it's kinda redundant. Prewet is like mixing once.
        ...aspirateCommands,
        dispense({
          pipette: data.pipette,
          volume: data.volume * sourceWellChunk.length,
          labware: data.destLabware,
          well: data.destWell
        }),
        ...trashTheDisposalVol,
        ...mixAfterCommands,
        ...blowoutCommand
      ]
    }
  )

  return reduceCommandCreators(CommandCreators)(prevRobotState)
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
