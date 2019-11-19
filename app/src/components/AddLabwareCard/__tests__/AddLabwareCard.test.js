// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Cfg from '../../../config'

import * as CustomLabware from '../../../custom-labware'
import { AddLabwareCard } from '..'
import { ManagePath } from '../ManagePath'
import { AddLabware } from '../AddLabware'

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

  test('passes labware directory to ManagePath', () => {
    const wrapper = render()
    const detail = wrapper.find(ManagePath)

    expect(mockGetConfig).toHaveBeenCalledWith({ state: true })
    expect(detail.prop('path')).toEqual(mockLabwarePath)
  })

  test('passes dispatch function to ManagePath', () => {
    const wrapper = render()
    const control = wrapper.find(ManagePath)
    const expectedAction = CustomLabware.changeCustomLabwareDirectory()

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    control.invoke('onChangePath')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedAction)
  })

  test('passes dispatch function to AddLabware', () => {
    const wrapper = render()
    const control = wrapper.find(AddLabware)
    const expectedAction = CustomLabware.addCustomLabware()

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    control.invoke('onAddLabware')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedAction)
  })
})
