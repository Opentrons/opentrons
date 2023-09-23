export function get96Channel384WellPlateWells(
  all384Wells: string[],
  well: string
): string[] {
  const totalWells = 96 * 2 //  multiplying 2 because we will remove either odd or even numbers

  const filterWellsFor96Channel = (start: number, isOdd: boolean): string[] => {
    const filteredWells: string[] = []
    let count = start
    for (let i = 0; i < totalWells; i++) {
      if (count < all384Wells.length) {
        const well = all384Wells[count]
        const numberFromWell = well.match(/\d+/)
        if (numberFromWell) {
          const number = parseInt(numberFromWell[0])
          if ((number % 2 === 1 && isOdd) || (number % 2 === 0 && !isOdd)) {
            filteredWells.push(well)
          }
        }
        count += 2
      } else {
        break
      }
    }
    return filteredWells
  }

  const allSetsOfWells = [
    filterWellsFor96Channel(0, true),
    filterWellsFor96Channel(1, true),
    filterWellsFor96Channel(0, false),
    filterWellsFor96Channel(1, false),
  ]

  for (const wells of allSetsOfWells) {
    if (wells.includes(well)) {
      return wells
    }
  }

  return []
}
