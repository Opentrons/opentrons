import * as React from 'react'
import { when } from 'jest-when'
import '@testing-library/jest-dom'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'

import { RunTimeControl } from '../../../../organisms/RunTimeControl'
import { RunTimer } from '../RunTimer'
import { RunControls } from '../RunControls'
import { ModuleLiveStatusCards } from '../ModuleLiveStatusCards'
import { RunPanel } from '../'

jest.mock('../RunTimer')
jest.mock('../RunControls')
jest.mock('../ModuleLiveStatusCards')
jest.mock('../../../../redux/config')
jest.mock('../../../../organisms/RunTimeControl')

const mockRunTimer = RunTimer as jest.Mock
const mockRunControls = RunControls as jest.MockedFunction<typeof RunControls>
const mockModuleLiveStatusCards = ModuleLiveStatusCards as jest.Mock
const mockRunTimeControl = RunTimeControl as jest.Mock

const render = () => {
  return renderWithProviders(<RunPanel />, { i18nInstance: i18n })[0]
}

describe('RunSetupCard', () => {
  beforeEach(() => {
    when(mockRunTimer)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => <div>Mock Run Timer</div>)
    when(mockRunControls)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => <div>Mock Run Controls</div>)
    when(mockModuleLiveStatusCards)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => <div>Mock Module Live Status Cards</div>)
    when(mockRunTimeControl)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => <div>Mock Run Time Control</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders run panel components', () => {
    const { getByText } = render()
    getByText('Mock Run Time Control')
    getByText('Mock Module Live Status Cards')
    expect(mockRunTimer).not.toHaveBeenCalled()
    expect(mockRunControls).not.toHaveBeenCalled()
  })
})
