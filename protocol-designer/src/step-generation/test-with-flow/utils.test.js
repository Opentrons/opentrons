// @flow
import {repeatArray, reduceCommandCreators, splitLiquid, mergeLiquid, AIR} from '../utils'

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
  // NOTE: using 'any' types all over here so I don't have to write a longer test with real RobotState
  type CountState = {count: number}
  const addCreator: any = (num: number) => (prevState: CountState) => ({
    commands: [`command: add ${num}`],
    robotState: {count: prevState.count + num},
    errors: null
  })

  const multiplyCreator: any = (num: number) => (prevState: CountState) => ({
    commands: [`command: multiply by ${num}`],
    robotState: {count: prevState.count * num},
    errors: null
  })

  const divideCreator: any = (num: number) => (prevState: CountState) => {
    let errors = []

    if (num === 0) {
      errors.push({
        message: 'Cannot divide by zero',
        type: 'DIVIDE_BY_ZERO'
      })
    }

    return {
      commands: [`command: divide by ${num}`],
      robotState: {count: prevState.count / num},
      errors
    }
  }

  test('basic command creators', () => {
    const initialState: any = {count: 0}
    const result: any = reduceCommandCreators([addCreator(1), multiplyCreator(2)])(initialState)

    expect(result.robotState).toEqual({count: 2})

    expect(result.commands).toEqual([
      'command: add 1',
      'command: multiply by 2'
    ])
  })

  test('error in a command short-circuits the command creation pipeline', () => {
    const initialState: any = {count: 5}
    const result = reduceCommandCreators([
      addCreator(4),
      divideCreator(0),
      multiplyCreator(3)
    ])(initialState)

    expect(result.errors).toEqual([{
      message: 'Cannot divide by zero',
      type: 'DIVIDE_BY_ZERO'
    }])

    expect(result.errorStep).toEqual(1) // divide step passed the error

    expect(result.commands).toEqual(['command: add 4'])

    expect(result.robotState).toEqual({count: 9}) // state after prev adding step
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

  test('splitting with no ingredients in source just splits "air"', () => {
    expect(
      splitLiquid(100, {})
    ).toEqual({
      source: {},
      dest: {[AIR]: {volume: 100}}
    })
  })

  test('splitting with 0 volume in source just splits "air"', () => {
    expect(
      splitLiquid(100, {ingred1: {volume: 0}})
    ).toEqual({
      source: {ingred1: {volume: 0}},
      dest: {[AIR]: {volume: 100}}
    })
  })

  test('splitting with excessive volume leaves "air" in dest', () => {
    expect(
      splitLiquid(100, {ingred1: {volume: 50}, ingred2: {volume: 20}})
    ).toEqual({
      source: {ingred1: {volume: 0}, ingred2: {volume: 0}},
      dest: {ingred1: {volume: 50}, ingred2: {volume: 20}, [AIR]: {volume: 30}}
    })
  })

  // TODO Ian 2018-03-19 figure out what to do with air warning reporting
  test.skip('splitting with air in source should throw error', () => {
    expect(
      () => splitLiquid(50, {ingred1: {volume: 100}, [AIR]: {volume: 20}})
    ).toThrow(/source cannot contain air/)
  })
})

describe('mergeLiquid', () => {
  test('merge ingreds 1 2 with 2 3 to get 1 2 3', () => {
    expect(mergeLiquid(
      {
        ingred1: {volume: 30},
        ingred2: {volume: 40}
      },
      {
        ingred2: {volume: 15},
        ingred3: {volume: 25}
      }
    )).toEqual({
      ingred1: {volume: 30},
      ingred2: {volume: 55},
      ingred3: {volume: 25}
    })
  })

  test('merge ingreds 3 with 1 2 to get 1 2 3', () => {
    expect(mergeLiquid(
      {
        ingred3: {volume: 25}
      },
      {
        ingred1: {volume: 30},
        ingred2: {volume: 40}
      }
    )).toEqual({
      ingred1: {volume: 30},
      ingred2: {volume: 40},
      ingred3: {volume: 25}
    })
  })
})
