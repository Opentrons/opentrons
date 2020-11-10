// @flow
// robot information card tests
import * as React from 'react'
import { Link } from 'react-router-dom'

import { mountWithStore } from '@opentrons/components/__utils__'
import { LabeledValue, SecondaryBtn, Tooltip } from '@opentrons/components'

import * as Buildroot from '../../../buildroot'
import * as Discovery from '../../../discovery'
import { mockConnectableRobot } from '../../../discovery/__fixtures__'
import { checkShellUpdate } from '../../../shell'
import { InformationCard } from '../InformationCard'

import type { State } from '../../../types'
import type { DiscoveredRobot } from '../../../discovery/types'

jest.mock('react-router-dom', () => ({
  Link: 'a',
}))

jest.mock('../../../buildroot/selectors')
jest.mock('../../../discovery/selectors')

const getBuildrootUpdateDisplayInfo: JestMockFn<
  [State, string],
  $Call<typeof Buildroot.getBuildrootUpdateDisplayInfo, State, string>
> = Buildroot.getBuildrootUpdateDisplayInfo

const getRobotApiVersion: JestMockFn<
  [DiscoveredRobot],
  $Call<typeof Discovery.getRobotApiVersion, DiscoveredRobot>
> = Discovery.getRobotApiVersion

const getRobotFirmwareVersion: JestMockFn<
  [DiscoveredRobot],
  $Call<typeof Discovery.getRobotFirmwareVersion, DiscoveredRobot>
> = Discovery.getRobotFirmwareVersion

const getRobotProtocolApiVersion: JestMockFn<
  [DiscoveredRobot],
  $Call<typeof Discovery.getRobotProtocolApiVersion, DiscoveredRobot>
> = Discovery.getRobotProtocolApiVersion

const MOCK_ROBOT_VERSION = '1.2.3'
const MOCK_FIRMWARE_VERSION = '4.5.6'
const MOCK_MIN_PAPI_VERSION = '1.0'
const MOCK_MAX_PAPI_VERSION = '2.8'
describe('InformationCard', () => {
  const render = (robot = mockConnectableRobot) => {
    const updateUrl = `/robots/${robot.name}/update`
    return mountWithStore(
      <InformationCard robot={robot} updateUrl={updateUrl} />
    )
  }

  beforeEach(() => {
    jest.useFakeTimers()
    getBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    getRobotApiVersion.mockReturnValue(MOCK_ROBOT_VERSION)
    getRobotFirmwareVersion.mockReturnValue(MOCK_FIRMWARE_VERSION)
    getRobotProtocolApiVersion.mockReturnValue({
      min: MOCK_MIN_PAPI_VERSION,
      max: MOCK_MAX_PAPI_VERSION,
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it('checks for update availability on an interval', () => {
    const { store } = render()

    expect(store.dispatch).not.toHaveBeenCalledWith(checkShellUpdate())
    jest.advanceTimersByTime(60001)
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(checkShellUpdate())
  })

  it('should show the robot displayName in a LabeledValue', () => {
    const { wrapper } = render()

    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Robot name"]')

    expect(labeledValue.prop('value')).toBe(mockConnectableRobot.displayName)
  })

  it('should show the robot server version in a LabeledValue', () => {
    const { wrapper } = render()

    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Server version"]')

    expect(getRobotApiVersion).toHaveBeenCalledWith(mockConnectableRobot)
    expect(labeledValue.prop('value')).toBe(MOCK_ROBOT_VERSION)
  })

  it('should show "unknown" server version if unknown', () => {
    getRobotApiVersion.mockReturnValue(null)

    const { wrapper } = render()
    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Server version"]')

    expect(labeledValue.prop('value')).toBe('Unknown')
  })

  it('should show the motor controller firmware version in a LabeledValue', () => {
    const { wrapper } = render()

    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Firmware version"]')

    expect(getRobotFirmwareVersion).toHaveBeenCalledWith(mockConnectableRobot)
    expect(labeledValue.prop('value')).toBe(MOCK_FIRMWARE_VERSION)
  })

  it('should show "unknown" firmware version if unknown', () => {
    getRobotFirmwareVersion.mockReturnValue(null)

    const { wrapper } = render()
    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Firmware version"]')

    expect(labeledValue.prop('value')).toBe('Unknown')
  })

  it('should show the protocol API versions in a LabeledValue', () => {
    const { wrapper } = render()

    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Supported Protocol API Versions"]')

    expect(getRobotProtocolApiVersion).toHaveBeenCalledWith(
      mockConnectableRobot
    )
    expect(labeledValue.prop('value')).toBe(
      `Min: ${MOCK_MIN_PAPI_VERSION},  Max: ${MOCK_MAX_PAPI_VERSION}`
    )
  })

  it('should show "unknown" protocol API versions if unknown', () => {
    getRobotProtocolApiVersion.mockReturnValue(null)

    const { wrapper } = render()
    const labeledValue = wrapper
      .find(LabeledValue)
      .filter('[label="Supported Protocol API Versions"]')

    expect(labeledValue.prop('value')).toBe('Min: Unknown,  Max: Unknown')
  })

  it('should have a link to the update page if an update is available', () => {
    const { wrapper } = render()

    const updateButton = wrapper.find(SecondaryBtn)
    const disabledTooltip = wrapper.find(Tooltip)

    expect(updateButton.prop('as')).toBe(Link)
    expect(updateButton.prop('to')).toBe(wrapper.prop('updateUrl'))
    expect(updateButton.text()).toBe('upgrade')
    expect(disabledTooltip.exists()).toBe(false)
  })

  it('update link should go nowhere if autoupdate is disabled', () => {
    getBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'unavailable',
      autoUpdateDisabledReason: 'oh no!',
      updateFromFileDisabledReason: null,
    })

    const { wrapper } = render()

    const updateButton = wrapper.find(SecondaryBtn)
    const disabledTooltip = wrapper.find(Tooltip)

    expect(updateButton.prop('to')).toBe('#')
    expect(updateButton.prop('className')).toBe('disabled')
    expect(updateButton.text()).toBe('unavailable')
    expect(disabledTooltip.prop('children')).toBe('oh no!')
  })
})
