// @flow
import {repeatArray, reduceCommandCreators, splitLiquid} from '../utils'

describe('repeatArray', () => {
  test('repeat array of objects', () => {
    expect(repeatArray([{a: 1}, {b: 2}, {c: 3}], 3)).toEqual([
      {a: 1}, {b: 2}, {c: 3},
      {a: 1}, {b: 2}, {c: 3},
      {a: 1}, {b: 2}, {c: 3}
    ])
  })

  test('repeat array of arrays', () => {
    expect(repeatArray([[1, 2], [3, 4]], 4)).toEqual([
      [1, 2], [3, 4],
      [1, 2], [3, 4],
      [1, 2], [3, 4],
      [1, 2], [3, 4]
    ])
  })
})

describe('reduceCommandCreators', () => {
  test('basic command creators', () => {
    // NOTE: using 'any' types all over here so I don't have to write a longer test with real RobotState
    const addCreator: any = (num: number) => (prevState: {count: number}) => ({
      commands: [`command: add ${num}`],
      robotState: {count: prevState.count + num}
    })

    const multiplyCreator: any = (num: number) => (prevState: {count: number}) => ({
      commands: [`command: multiply by ${num}`],
      robotState: {count: prevState.count * num}
    })

    const initialState: any = {count: 0}
    const result: any = reduceCommandCreators([addCreator(1), multiplyCreator(2)])(initialState)

    expect(result.robotState).toEqual({count: 2})

    expect(result.commands).toEqual([
      'command: add 1',
      'command: multiply by 2'
    ])
  })
})

describe('splitLiquid', () => {
  const singleIngred = {
    ingred1: {volume: 100}
  }

  const twoIngred = {
    ingred1: {volume: 100},
    ingred2: {volume: 300}
  }

  test('simple split with 1 ingredient in source', () => {
    expect(splitLiquid(
      60,
      singleIngred
    )).toEqual({
      source: {ingred1: {volume: 40}},
      dest: {ingred1: {volume: 60}}
    })
  })

  test('get 0 volume in source when you split it all', () => {
    expect(splitLiquid(
      100,
      singleIngred
    )).toEqual({
      source: {ingred1: {volume: 0}},
      dest: {ingred1: {volume: 100}}
    })
  })

  test('split with 2 ingredients in source', () => {
    expect(splitLiquid(
      20,
      twoIngred
    )).toEqual({
      source: {
        ingred1: {volume: 95},
        ingred2: {volume: 285}
      },
      dest: {
        ingred1: {volume: 5},
        ingred2: {volume: 15}
      }
    })
  })

  test('split all with 2 ingredients', () => {
    expect(splitLiquid(
      400,
      twoIngred
    )).toEqual({
      source: {
        ingred1: {volume: 0},
        ingred2: {volume: 0}
      },
      dest: twoIngred
    })
  })

  test('taking out 0 volume results in same source, empty dest', () => {
    expect(splitLiquid(
      0,
      twoIngred
    )).toEqual({
      source: twoIngred,
      dest: {
        ingred1: {volume: 0},
        ingred2: {volume: 0}
      }
    })
  })

  test('split with 2 ingreds, one has 0 vol', () => {
    expect(splitLiquid(
      50,
      {
        ingred1: {volume: 200},
        ingred2: {volume: 0}
      }
    )).toEqual({
      source: {
        ingred1: {volume: 150},
        ingred2: {volume: 0}
      },
      dest: {
        ingred1: {volume: 50},
        ingred2: {volume: 0}
      }
    })
  })

  test('split with 2 ingredients, floating-point volume', () => {
    expect(splitLiquid(
      1000 / 3, // ~333.33
      twoIngred
    )).toEqual({
      source: {
        ingred1: {volume: 100 - (0.25 * 1000 / 3)},
        ingred2: {volume: 50}
      },
      dest: {
        ingred1: {volume: 0.25 * 1000 / 3},
        ingred2: {volume: 250}
      }
    })
  })

  test('splitting with no ingredients in source raises error', () => {
    expect(
      () => splitLiquid(100, {})
    ).toThrowError(/no volume in source/)
  })

  test('splitting with 0 volume in source raises error', () => {
    expect(
      () => splitLiquid(100, {ingred1: {volume: 0}})
    ).toThrowError(/no volume in source/)
  })

  test('splitting with excessive volume raises error', () => {
    expect(
      () => splitLiquid(999, {ingred1: {volume: 10}})
    ).toThrowError(/exceeds source volume/)
  })
})
