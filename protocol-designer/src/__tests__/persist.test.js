// @flow

import * as persist from '../persist'

describe('persist', () => {
  describe('getLocalStorageItem', () => {
    let getItemMock
    beforeEach(() => {
      getItemMock = jest.spyOn(
        Object.getPrototypeOf(global.localStorage),
        'getItem'
      )
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    test('retrieves localStorage data by key and parses data when it exists', () => {
      const value = { test: 'some value' }
      getItemMock.mockReturnValue(JSON.stringify(value))

      const result = persist.getLocalStorageItem('key')

      expect(result).toEqual(value)
    })

    test('returns undefined when localStorage could not be retrieved for key given', () => {
      getItemMock.mockImplementation(() => {
        throw new Error('something went wrong!')
      })

      const result = persist.getLocalStorageItem('key')

      expect(result).toBeUndefined()
    })
  })

  describe('setLocalStorageItem', () => {
    let setItemMock
    beforeEach(() => {
      jest.clearAllMocks()
      setItemMock = jest.spyOn(
        Object.getPrototypeOf(global.localStorage),
        'setItem'
      )
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    test('adds prefix to key sets localStorage item by key', () => {
      const value = { a: 'a', b: 'b' }
      setItemMock.mockReturnValue(undefined)

      persist.setLocalStorageItem('key', value)

      expect(setItemMock).toHaveBeenCalledWith(
        'root.key',
        JSON.stringify(value)
      )
    })
  })
})
