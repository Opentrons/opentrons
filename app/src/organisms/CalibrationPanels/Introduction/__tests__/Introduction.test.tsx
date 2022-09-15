import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { mockCalibrationCheckLabware } from '../../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../../redux/sessions'
import { i18n } from '../../../../i18n'
import { Introduction } from '../'
import { ChooseTipRack } from '../../ChooseTipRack'

jest.mock('../../ChooseTipRack')

const mockChooseTipRack = ChooseTipRack as jest.MockedFunction<
  typeof ChooseTipRack
>

describe('Introduction', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof Introduction>>
  ) => ReturnType<typeof renderWithProviders>
  const mockSendCommands = jest.fn()
  const mockCleanUpAndExit = jest.fn()

  beforeEach(() => {
    mockChooseTipRack.mockReturnValue(<div>mock choose tip rack</div>)
    render = (props = {}) =>
      renderWithProviders(
        <Introduction
          sendCommands={mockSendCommands}
          cleanUpAndExit={mockCleanUpAndExit}
          tipRack={mockCalibrationCheckLabware}
          isMulti={false}
          mount="left"
          currentStep={Sessions.CHECK_STEP_LABWARE_LOADED}
          sessionType={Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK}
          {...props}
        />,
        {
          i18nInstance: i18n,
        }
      )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct text', () => {
    const { getByRole, queryByRole } = render()[0]
    getByRole('heading', { name: 'Before you begin' })
    getByRole('button', { name: 'Get started' })
    getByRole('link', { name: 'Need help?' })
    expect(queryByRole('button', { name: 'Change tip rack' })).toBe(null)
  })
  it('renders change tip rack button if deck calibration', () => {
    const { getByRole, getByText, queryByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })[0]
    const button = getByRole('button', { name: 'Change tip rack' })
    button.click()
    getByText('mock choose tip rack')
    expect(queryByRole('heading', { name: 'Before you begin' })).toBe(null)
  })
  it('clicking proceed loads alternate tiprack if load labware supported for session', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      supportedCommands: [Sessions.sharedCalCommands.LOAD_LABWARE],
    })[0]
    getByRole('button', { name: 'Get started' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: 'calibration.loadLabware',
      data: { tiprackDefinition: mockCalibrationCheckLabware.definition },
    })
  })
  it('clicking proceed loads default if load labware is not supported for session', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })[0]
    getByRole('button', { name: 'Get started' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: 'calibration.loadLabware',
    })
  })
})
