import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockRobotSideAnalysis } from '/app/molecules/Command/__fixtures__'

import { RunningProtocolCommandList } from '..'

import type { ComponentProps } from 'react'

const mockShowModal = vi.fn()

const render = (props: ComponentProps<typeof RunningProtocolCommandList>) => {
  return renderWithProviders(<RunningProtocolCommandList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RunningProtocolCommandList', () => {
  let props: ComponentProps<typeof RunningProtocolCommandList>
  beforeEach(() => {
    props = {
      onTogglePlayPause: vi.fn(),
      onStop: mockShowModal,
      runStatus: RUN_STATUS_RUNNING,
      robotSideAnalysis: mockRobotSideAnalysis,
      protocolName: 'mockRunningProtocolName',
      currentRunCommandIndex: 0,
      robotType: FLEX_ROBOT_TYPE,
      allRunDefs: [],
    }
  })
  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Running')
    screen.getByText('mockRunningProtocolName')
    screen.getByText('Load P300 Single-Channel GEN1 on left mount')
    screen.getByLabelText('stop')
    screen.getByLabelText('pause')
  })

  it('should render play button when runStatus is idle', () => {
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    render(props)
    screen.getByLabelText('play')
  })

  it('when tapping stop button, the modal is showing up', () => {
    render(props)
    const button = screen.getByLabelText('stop')
    fireEvent.click(button)
    expect(mockShowModal).toHaveBeenCalled()
  })

  it("it displays the run's current action number", () => {
    render({ ...props, currentRunCommandIndex: 11 })
    screen.getByText(12)
  })

  // ToDo (kj:04/10/2023) once we fix the track event stuff, we can implement tests
  it.todo('when tapping play button, track event mock function is called')
})
