export function getWellRangeForLiquidLabwarePair(
  volumeByWell: { [well: string]: number },
  labwareWellOrdering: string[][]
): Array<{
  wellName: string
  volume: number
}> {
  return labwareWellOrdering.reduce(
    (volumePerWellRange: Array<{ wellName: string; volume: number }>, row) => {
      const rangeAndWellsPerRow = row.reduce(
        (rangeAndWells, well, index) => {
          if (index === 0 && volumeByWell[well] != null) {
            rangeAndWells.range = true
            rangeAndWells.wells.push({
              wellName: well,
              volume: volumeByWell[well],
            })
          } else if (
            rangeAndWells.wells.length === index &&
            rangeAndWells.range &&
            volumeByWell[well] != null &&
            volumeByWell[well] === rangeAndWells.wells[index - 1].volume
          ) {
            rangeAndWells.wells.push({
              wellName: well,
              volume: volumeByWell[well],
            })
          } else if (volumeByWell[well] != null) {
            rangeAndWells.range = false
            rangeAndWells.wells.push({
              wellName: well,
              volume: volumeByWell[well],
            })
          } else {
            rangeAndWells.range = false
          }
          return rangeAndWells
        },
        {
          range: false,
          wells: [] as Array<{ wellName: string; volume: number }>,
        }
      )
      if (rangeAndWellsPerRow.range && rangeAndWellsPerRow.wells.length > 1) {
        const rangeString = `${rangeAndWellsPerRow.wells[0].wellName}: ${
          rangeAndWellsPerRow.wells[rangeAndWellsPerRow.wells.length - 1]
            .wellName
        }`
        volumePerWellRange.push({
          wellName: rangeString,
          volume: rangeAndWellsPerRow.wells[0].volume,
        })
      } else {
        volumePerWellRange = volumePerWellRange.concat(
          rangeAndWellsPerRow.wells
        )
      }
      return volumePerWellRange
    },
    []
  )
}
