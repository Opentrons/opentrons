import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'
import { SOURCE_WELL_BLOWOUT_DESTINATION } from '@opentrons/step-generation'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { DisposalVolume } from '../DisposalVolume'

import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

vi.mock('/app/redux-resources/analytics')
vi.mock('/app/resources/deck_configuration')

let mockTrackEventWithRobotSerial: any

const render = (props: ComponentProps<typeof DisposalVolume>) => {
  return renderWithProviders(<DisposalVolume {...props} />, {
    i18nInstance: i18n,
  })
}

const modifiedQuickTransferState = {
  ...QuickTransferState,
  path: 'multiDispense',
}
const mockDeckConfig = [
  {
    cutoutId: 'cutoutA3', // should match trashbin position in QuickTransferState
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
  },
]

describe('DisposalVolume', () => {
  let props: ComponentProps<typeof DisposalVolume>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      state: modifiedQuickTransferState as any,
      dispatch: vi.fn(),
      kind: 'dispense',
    }
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: mockDeckConfig,
    } as UseQueryResult<DeckConfiguration>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders text, buttons for disposal volume', () => {
    render(props)
    screen.getByText('Disposal volume')
    screen.getByText('Continue')
    screen.getByText('Disposal volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('renders text, buttons for disposal volume blowout location', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Disposal volume')
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Continue')
    screen.getByText('Trash bin in A3')
    screen.getByText('Source well')
  })

  it('renders text, buttons for disposal volume flow rate', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Disposal volume')
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Continue')
    await user.click(screen.getByText('Source well'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Blowout flow rate (µL/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('should call mock function when clicking save button', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Disposal volume')
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Continue')
    await user.click(screen.getByText('Source well'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Blowout flow rate (µL/second)')
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_DISPOSAL_VOLUME_DISPENSE',
      disposalVolumeDispenseSettings: {
        volume: 1,
        blowOutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
        flowRate: 1,
      },
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'DisposalVolume_dispense',
      },
    })
  })

  it('should call mock function when clicking back button', async () => {
    const user = userEvent.setup()
    render(props)
    await user.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })

  it('shows an error and disables continue for invalid volume input', async () => {
    const user = userEvent.setup()
    render(props)
    await user.type(screen.getByLabelText('Disposal volume (µL)'), 'abc')
    screen.getByText('Enter a valid number')
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
  })
})
