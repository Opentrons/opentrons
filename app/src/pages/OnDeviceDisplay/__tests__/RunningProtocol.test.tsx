import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import {
  CurrentRunningProtocolCommand,
  RunningProtocolCommandList,
  RunningProtocolSkelton,
} from '../../../organisms/OnDeviceDisplay/RunningProtocol'
import { RunningProtocol } from '../RunningProtocol'

const mockCurrentRunningProtocolCommand = CurrentRunningProtocolCommand as jest.MockedFunction<
  typeof CurrentRunningProtocolCommand
>
const mockRunningProtocolCommandList = RunningProtocolCommandList as jest.MockedFunction<
  typeof RunningProtocolCommandList
>
const mockRunningProtocolSkelton = RunningProtocolSkelton as jest.MockedFunction<
  typeof RunningProtocolSkelton
>

describe('RunningProtocol', () => {
  beforeEach(() => {
    mockCurrentRunningProtocolCommand.mockReturnValue(
      <div>mock CurrentRunningProtocolCommand</div>
    )
    mockRunningProtocolCommandList.mockReturnValue(
      <div>mock RunningProtocolCommandList</div>
    )
    mockRunningProtocolSkelton.mockReturnValue(
      <div>mock RunningProtocolSkelton</div>
    )
  })
  it('should render Skelton when robotSideAnalysis does not have data', () => {
    const [{ getByText }] = render()
  })

  it('should render CurrentRunningProtocolCommand when loaded the data', () => {})

  it('should render RunningProtocolCommandList when swiping left', () => {})

  it('should render CurrentRunningProtocolCommand when swiping right', () => {})
})
