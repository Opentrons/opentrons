import * as React from 'react'
import { when } from 'vitest-when'
import { it, describe, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { useCreateRunMutation, useHost } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { ProtocolSetupParameters } from '..'
import { ChooseEnum } from '../ChooseEnum'
import { mockRunTimeParameterData } from '../../../pages/ProtocolDetails/fixtures'
import type * as ReactRouterDom from 'react-router-dom'
import type { HostConfig } from '@opentrons/api-client'

const mockGoBack = vi.fn()

vi.mock('../ChooseEnum')
vi.mock('@opentrons/react-api-client')
vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof ReactRouterDom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({ goBack: mockGoBack } as any),
  }
})
const MOCK_HOST_CONFIG: HostConfig = { hostname: 'MOCK_HOST' }
const mockCreateRun = vi.fn()
const render = (
  props: React.ComponentProps<typeof ProtocolSetupParameters>
) => {
  return renderWithProviders(<ProtocolSetupParameters {...props} />, {
    i18nInstance: i18n,
  })
}
describe('ProtocolSetupParameters', () => {
  let props: React.ComponentProps<typeof ProtocolSetupParameters>

  beforeEach(() => {
    props = {
      protocolId: 'mockId',
      labwareOffsets: [],
      runTimeParameters: mockRunTimeParameterData,
    }
    vi.mocked(ChooseEnum).mockReturnValue(<div>mock ChooseEnum</div>)
    vi.mocked(useHost).mockReturnValue(MOCK_HOST_CONFIG)
    when(vi.mocked(useCreateRunMutation))
      .calledWith(expect.anything())
      .thenReturn({ createRun: mockCreateRun } as any)
  })
  it('renders the parameters labels and mock data', () => {
    render(props)
    screen.getByText('Parameters')
    screen.getByText('Restore default values')
    screen.getByRole('button', { name: 'Confirm values' })
    screen.getByText('Dry Run')
    screen.getByText('a dry run description')
  })
  it('renders the ChooseEnum component when a str param is selected', () => {
    render(props)
    fireEvent.click(screen.getByText('Default Module Offsets'))
    screen.getByText('mock ChooseEnum')
  })
  it('renders the other setting when boolean param is selected', () => {
    render(props)
    screen.getByText('Off')
    expect(screen.getAllByText('On')).toHaveLength(3)
    fireEvent.click(screen.getByText('Dry Run'))
    expect(screen.getAllByText('On')).toHaveLength(4)
  })
  it('renders the back icon and calls useHistory', () => {
    render(props)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockGoBack).toHaveBeenCalled()
  })
  it('renders the confirm values button and clicking on it creates a run', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm values' }))
    expect(mockCreateRun).toHaveBeenCalled()
  })
  it('renders the reset values modal', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Restore default values' })
    )
    screen.getByText(
      'This will discard any changes you have made. All parameters will have their default values.'
    )
    const title = screen.getByText('Reset parameter values?')
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(title).not.toBeInTheDocument()
    //  TODO(jr, 3/19/24): wire up the confirm button
  })
})
