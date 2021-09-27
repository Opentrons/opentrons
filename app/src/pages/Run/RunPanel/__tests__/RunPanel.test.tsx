import * as React from 'react'
import { when } from 'jest-when'
import '@testing-library/jest-dom'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components/__utils__'

import { i18n } from '../../../../i18n'

import { useFeatureFlag } from '../../../../redux/config'
import { RunTimeControl } from '../../../../organisms/RunTimeControl'
import { RunTimer } from '../RunTimer'
import { RunControls } from '../RunControls'
import { ModuleLiveStatusCards } from '../ModuleLiveStatusCards'
import { RunPanelComponent } from '../'

jest.mock('../RunTimer')
jest.mock('../RunControls')
jest.mock('../ModuleLiveStatusCards')
jest.mock('../../../../redux/config')
jest.mock('../../../../organisms/RunTimeControl')

const mockRunTimer = RunTimer as jest.MockedFunction<typeof RunTimer>
const mockRunControls = RunControls as jest.MockedFunction<typeof RunControls>
const mockModuleLiveStatusCards = ModuleLiveStatusCards as jest.MockedFunction<typeof ModuleLiveStatusCards>
const mockRunTimeControl = RunTimeControl as jest.MockedFunction<typeof RunTimeControl>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>


describe('RunSetupCard', () => {
  let render: () => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    when(mockRunTimer)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => (
        <div>Mock Run Timer</div>
      ))

    when(mockRunControls)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => (
        <div>Mock Run Controls</div>
      ))

    when(mockModuleLiveStatusCards)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => (
        <div>Mock Module Live Status Cards</div>
      ))

    when(mockRunTimeControl)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => (
        <div>Mock Run Time Control</div>
      ))

    render = () => {
      return renderWithProviders(
        <RunPanelComponent
          disabled={true}
          modulesReady={true}
          isReadyToRun={true}
          isPaused={true}
          isRunning={true}
          isBlocked={true}
          onRunClick={() => {}}
          onPauseClick={() => {}}
          onResumeClick={() => {}}
          onResetClick={() => {}}
        />
        , { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders legacy run panel components when usePreProtocolWithoutRPC ff is not set', () => {
    when(mockUseFeatureFlag)
      .calledWith('preProtocolFlowWithoutRPC')
      .mockReturnValue(false)
    const { getByText } = render()
    getByText('Mock Run Timer')
    getByText('Mock Run Controls')
    getByText('Mock Module Live Status Cards')
    expect(mockRunTimeControl).not.toHaveBeenCalled()
  })

  it('renders new run panel components when usePreProtocolWithoutRPC ff is set', () => {
    when(mockUseFeatureFlag)
      .calledWith('preProtocolFlowWithoutRPC')
      .mockReturnValue(true)
    const { getByText } = render()
    getByText('Mock Run Time Control')
    getByText('Mock Module Live Status Cards')
    expect(mockRunTimer).not.toHaveBeenCalled()
    expect(mockRunControls).not.toHaveBeenCalled()
  })
})
