import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect, afterEach } from 'vitest'

import { BaseDeck } from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupDeckConfiguration } from '..'

import type { UseQueryResult } from 'react-query'
import type {
  CompletedProtocolAnalysis,
  DeckConfiguration,
} from '@opentrons/shared-data'

vi.mock('@opentrons/components/src/hardware-sim/BaseDeck/index')
vi.mock('@opentrons/react-api-client')
vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')

const mockSetSetupScreen = vi.fn()
const mockUpdateDeckConfiguration = vi.fn()
const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: ({
    commands: [],
    labware: [],
  } as unknown) as CompletedProtocolAnalysis,
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-3 Standard' as const,
}

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof BaseDeck>()
  return {
    ...actual,
    BaseDeck: vi.fn(),
  }
})

const render = (
  props: React.ComponentProps<typeof ProtocolSetupDeckConfiguration>
) => {
  return renderWithProviders(<ProtocolSetupDeckConfiguration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupDeckConfiguration', () => {
  let props: React.ComponentProps<typeof ProtocolSetupDeckConfiguration>

  beforeEach(() => {
    props = {
      cutoutId: 'cutoutD3',
      runId: 'mockRunId',
      setSetupScreen: mockSetSetupScreen,
      providedFixtureOptions: [],
    }
    vi.mocked(BaseDeck).mockReturnValue(<div>mock BaseDeck</div>)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('mockRunId')
      .thenReturn(PROTOCOL_DETAILS.protocolData)
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text, button, and DeckConfigurator', () => {
    render(props)
    screen.getByText('Deck configuration')
    screen.getByText('mock BaseDeck')
    screen.getByText('Confirm')
  })

  it('should call a mock function when tapping the back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockSetSetupScreen).toHaveBeenCalledWith('modules')
  })

  it('should call a mock function when tapping confirm button', () => {
    render(props)
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })
})
