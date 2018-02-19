// @flow
import {repeatArray, reduceCommandCreators} from '../utils'

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
