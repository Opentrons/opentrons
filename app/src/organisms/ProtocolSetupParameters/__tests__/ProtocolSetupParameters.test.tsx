import * as React from 'react'
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
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({
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
})
