import * as React from 'react'
import { when } from 'vitest-when'
import { it, describe, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { ProtocolSetupParameters } from '..'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { mockRunTimeParameterData } from '../../../pages/ProtocolDetails/fixtures'
import type * as ReactRouterDom from 'react-router-dom'

const mockGoBack = vi.fn()
vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof ReactRouterDom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({ goBack: mockGoBack } as any),
  }
})

const RUN_ID = 'mockId'
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
      runId: 'mockId',
      setSetupScreen: vi.fn(),
    }
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({
        runTimeParameters: mockRunTimeParameterData,
      } as any)
  })
  it('renders the parameters labels and mock data', () => {
    render(props)
    screen.getByText('Parameters')
    screen.getByText('Restore default values')
    screen.getByRole('button', { name: 'Confirm values' })
    screen.getByText('Dry Run')
    screen.getByText('a dry run description')
  })
  it('renders the back icon and calls useHistory', () => {
    render(props)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockGoBack).toHaveBeenCalled()
  })
  it('renders the confirm values button and clicking on it calls correct stuff', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm values' }))
    expect(props.setSetupScreen).toHaveBeenCalled()
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
