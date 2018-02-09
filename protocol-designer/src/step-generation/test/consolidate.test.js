// @flow
import {consolidate} from '../'

describe('consolidate', () => {
  test('junk test', () => {
    expect(consolidate('bad arg')).toEqual('nope')
  })
})
