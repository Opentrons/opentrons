import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { useDeckConfigurationCompatibility } from '../../../resources/deck_configuration/hooks'
import { LocationConflictModal } from '../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { FixtureTable } from '../FixtureTable'

jest.mock('../../../resources/deck_configuration/hooks')
jest.mock('../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal')

const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>
const mockUseDeckConfigurationCompatibility = useDeckConfigurationCompatibility as jest.MockedFunction<
  typeof useDeckConfigurationCompatibility
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
    mockUseDeckConfigurationCompatibility.mockReturnValue([
      {
        cutoutId: 'cutoutD3',
        cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        requiredAddressableAreas: ['D4'],
        compatibleCutoutFixtureIds: [
          STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
        ],
      },
    ])
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
  // TODO(bh, 2023-11-14): implement test cases when example JSON protocol fixtures exist
  // it('should render the current status - not configured', () => {
  //   props = {
  //     ...props,
  //     mostRecentAnalysis: { commands: [] } as any,
  //   }
  //   const [{ getByText }] = render(props)
  //   getByText('Not configured')
  // })
  // it('should render the current status - conflicting', () => {
  //   props = {
  //     ...props,
  //     mostRecentAnalysis: { commands: [] } as any,
  //   }
  //   const [{ getByText, getAllByText }] = render(props)
  //   getByText('Location conflict').click()
  //   getAllByText('mock location conflict modal')
  // })
  // it('should call a mock function when tapping not configured row', () => {
  //   props = {
  //     ...props,
  //     mostRecentAnalysis: { commands: [] } as any,
  //   }
  //   const [{ getByText }] = render(props)
  //   getByText('Not configured').click()
  //   expect(mockSetCutoutId).toHaveBeenCalledWith('cutoutD3')
  //   expect(mockSetSetupScreen).toHaveBeenCalledWith('deck configuration')
  //   expect(mockSetProvidedFixtureOptions).toHaveBeenCalledWith(['wasteChute'])
  // })
})
