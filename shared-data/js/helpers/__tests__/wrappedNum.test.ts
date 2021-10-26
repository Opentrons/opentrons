import { toWellName } from '../index'

describe('toWellName', () => {
  it('should wrap letters in row nomenclature for rows in number greater than 26', () => {

    const lastLetterAlphabetOne = toWellName({rowNum:25, colNum:1})
    expect(lastLetterAlphabetOne).toBe('Z2')

    const firstLetterAlphabetTwo = toWellName({rowNum:26, colNum:1})
    expect(firstLetterAlphabetTwo).toBe('AA2')

    const secondLetterAlphabetTwo = toWellName({rowNum:27, colNum:1})
    expect(secondLetterAlphabetTwo).toBe('BB2')

    const lastLetterAlphabetTwo = toWellName({rowNum:50, colNum:1})
    expect(lastLetterAlphabetTwo).toBe('ZZ2')

    const firstLetterAlphabetThree = toWellName({rowNum:51, colNum:1})
    expect(firstLetterAlphabetThree).toBe('AAA2')

  })
})
