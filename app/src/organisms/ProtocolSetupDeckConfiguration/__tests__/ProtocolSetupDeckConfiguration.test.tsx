import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
<<<<<<< HEAD
import { describe, it, vi, beforeEach, afterEach } from 'vitest'
=======
import { describe, it, vi, beforeEach, expect, afterEach } from 'vitest'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

import { BaseDeck } from '@opentrons/components'
import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ProtocolSetupDeckConfiguration } from '..'
import { useNotifyDeckConfigurationQuery } from '../../../resources/deck_configuration'

import type { UseQueryResult } from 'react-query'
import type {
  CompletedProtocolAnalysis,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { Modules } from '@opentrons/api-client'

vi.mock('@opentrons/components/src/hardware-sim/BaseDeck/index')
vi.mock('@opentrons/react-api-client')
vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
<<<<<<< HEAD
vi.mock('../../../resources/deck_configuration')

const mockSetSetupScreen = vi.fn()
=======

const mockSetSetupScreen = vi.fn()
const mockUpdateDeckConfiguration = vi.fn()
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
<<<<<<< HEAD
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
=======
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useDeckConfigurationQuery).mockReturnValue(({
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: vi.fn(),
    } as any)
    vi.mocked(useModulesQuery).mockReturnValue(({
      data: { data: [] },
    } as unknown) as UseQueryResult<Modules>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text, button, and DeckConfigurator', () => {
    render(props)
    screen.getByText('Deck configuration')
    screen.getByText('mock BaseDeck')
<<<<<<< HEAD
    screen.getByText('Save')
=======
    screen.getByText('Confirm')
  })

  it('should call a mock function when tapping the back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockSetSetupScreen).toHaveBeenCalledWith('modules')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })

  it('should call a mock function when tapping confirm button', () => {
    render(props)
<<<<<<< HEAD
    fireEvent.click(screen.getByText('Save'))
=======
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })
})
