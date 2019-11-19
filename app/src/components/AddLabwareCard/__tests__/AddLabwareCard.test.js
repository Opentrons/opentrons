// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Cfg from '../../../config'

import { changeCustomLabwareDirectory } from '../../../custom-labware'
import { AddLabwareCard } from '..'
import { PathDetail } from '../PathDetail'
import { ChangePathButton } from '../ChangePathButton'

import type { State } from '../../../types'
import type { Config } from '../../../config/types'

jest.mock('../../../config')

const mockGetConfig: JestMockFn<[State], $Shape<Config>> = Cfg.getConfig
const mockLabwarePath = '/path/to/labware'
const mockConfig = { labware: { directory: mockLabwarePath } }

describe('AddLabwareCard', () => {
  let mockStore
  let render

  beforeEach(() => {
    mockGetConfig.mockReturnValue(mockConfig)

    mockStore = {
      subscribe: () => {},
      getState: () => ({ state: true }),
      dispatch: jest.fn(),
    }

    render = () =>
      mount(
        <Provider store={mockStore}>
          <AddLabwareCard />
        </Provider>
      )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('passes labware directory to PathDetail', () => {
    const wrapper = render()
    const detail = wrapper.find(PathDetail)

    expect(mockGetConfig).toHaveBeenCalledWith({ state: true })
    expect(detail.prop('path')).toEqual(mockLabwarePath)
  })

  test('passes dispatch function to ChangePathButton', () => {
    const wrapper = render()
    const button = wrapper.find(ChangePathButton)
    const expectedAction = changeCustomLabwareDirectory()

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    button.invoke('onChangePath')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedAction)
  })
})
