import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { LocationConflictModal } from '../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { FixtureTable } from '../FixtureTable'

jest.mock('../../../resources/deck_configuration/hooks')
jest.mock('../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal')

const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>

const mockSetSetupScreen = jest.fn()
const mockSetCutoutId = jest.fn()
const mockSetProvidedFixtureOptions = jest.fn()

const render = (props: React.ComponentProps<typeof FixtureTable>) => {
  return renderWithProviders(<FixtureTable {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FixtureTable', () => {
  let props: React.ComponentProps<typeof FixtureTable>
  beforeEach(() => {
    props = {
      mostRecentAnalysis: [] as any,
      robotType: FLEX_ROBOT_TYPE,
      setSetupScreen: mockSetSetupScreen,
      setCutoutId: mockSetCutoutId,
      setProvidedFixtureOptions: mockSetProvidedFixtureOptions,
    }
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
  })

  it('should render table header and contents', () => {
    const [{ getByText }] = render(props)
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
  })
  it('should render the current status - configured', () => {
    props = {
      ...props,
      // TODO(bh, 2023-11-13): mock load labware etc commands
      mostRecentAnalysis: { commands: [] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Configured')
  })
  it('should render the current status - not configured', () => {
    props = {
      ...props,
      mostRecentAnalysis: { commands: [] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Not configured')
  })
  it('should render the current status - conflicting', () => {
    props = {
      ...props,
      mostRecentAnalysis: { commands: [] } as any,
    }
    const [{ getByText, getAllByText }] = render(props)
    getByText('Location conflict').click()
    getAllByText('mock location conflict modal')
  })
  it('should call a mock function when tapping not configured row', () => {
    props = {
      ...props,
      mostRecentAnalysis: { commands: [] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Not configured').click()
    expect(mockSetCutoutId).toHaveBeenCalledWith('cutoutD3')
    expect(mockSetSetupScreen).toHaveBeenCalledWith('deck configuration')
    expect(mockSetProvidedFixtureOptions).toHaveBeenCalledWith(['wasteChute'])
  })
})
