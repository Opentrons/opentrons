// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Cfg from '../../../config'

import * as CustomLabware from '../../../custom-labware'
import * as CustomLabwareFixtures from '../../../custom-labware/__fixtures__'
import { AddLabwareCard } from '..'
import { ManagePath } from '../ManagePath'
import { AddLabware } from '../AddLabware'
import { AddLabwareFailureModal } from '../AddLabwareFailureModal'

import type { State } from '../../../types'
import type { Config } from '../../../config/types'
import type { FailedLabwareFile } from '../../../custom-labware/types'

jest.mock('../../../config')
jest.mock('../../../custom-labware/selectors')

const mockGetConfig: JestMockFn<[State], $Shape<Config>> = Cfg.getConfig
const mockGetAddLabwareFailure: JestMockFn<
  [State],
  {| file: FailedLabwareFile | null, errorMessage: string | null |}
> = CustomLabware.getAddLabwareFailure

const mockLabwarePath = '/path/to/labware'
const mockConfig = { labware: { directory: mockLabwarePath } }

describe('AddLabwareCard', () => {
  let mockStore
  let render

  beforeEach(() => {
    mockGetConfig.mockReturnValue(mockConfig)
    mockGetAddLabwareFailure.mockReturnValue({ file: null, errorMessage: null })

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

  test('passes change path function to ManagePath', () => {
    const wrapper = render()
    const control = wrapper.find(ManagePath)
    const expectedChangeAction = CustomLabware.changeCustomLabwareDirectory()

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    control.invoke('onChangePath')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedChangeAction)
  })

  test('passes open path function to ManagePath', () => {
    const wrapper = render()
    const control = wrapper.find(ManagePath)
    const expectedOpenAction = CustomLabware.openCustomLabwareDirectory()

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    control.invoke('onOpenPath')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedOpenAction)
  })

  test('passes reset path function to ManagePath', () => {
    const wrapper = render()
    const control = wrapper.find(ManagePath)
    const expectedOpenAction = Cfg.resetConfig('labware.directory')

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    control.invoke('onResetPath')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedOpenAction)
  })

  test('passes dispatch function to AddLabware', () => {
    const wrapper = render()
    const control = wrapper.find(AddLabware)
    const expectedAction = CustomLabware.addCustomLabware()

    expect(mockStore.dispatch).toHaveBeenCalledTimes(0)
    control.invoke('onAddLabware')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(expectedAction)
  })

  test('renders an AddLabwareFailureModal if add labware fails', () => {
    mockGetAddLabwareFailure.mockReturnValue({
      file: CustomLabwareFixtures.mockInvalidLabware,
      errorMessage: 'AH',
    })

    const wrapper = render()
    const modal = wrapper.find(AddLabwareFailureModal)

    expect(modal.props()).toEqual({
      file: CustomLabwareFixtures.mockInvalidLabware,
      errorMessage: 'AH',
      directory: mockLabwarePath,
      onCancel: expect.any(Function),
      onOverwrite: expect.any(Function),
    })
  })

  test('AddLabwareFailureModal onCancel and onOverwrite hooked to dispatch', () => {
    const file = CustomLabwareFixtures.mockDuplicateLabware

    mockGetAddLabwareFailure.mockReturnValue({ file, errorMessage: null })

    const wrapper = render()
    const modal = wrapper.find(AddLabwareFailureModal)

    modal.invoke('onCancel')()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      CustomLabware.clearAddCustomLabwareFailure()
    )

    modal.invoke('onOverwrite')(file)
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      CustomLabware.addCustomLabware(file)
    )
  })
})
