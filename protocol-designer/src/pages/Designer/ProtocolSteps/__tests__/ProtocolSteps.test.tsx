import * as React from 'react'
import { describe, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { DeckSetupContainer } from '../../DeckSetup'
import { TimelineToolbox } from '../Timeline'
import { ProtocolSteps } from '..'

vi.mock('../../../../components/StepEditForm')
vi.mock('../../DeckSetup')
vi.mock('../Timeline')
const render = () => {
  return renderWithProviders(<ProtocolSteps />)[0]
}

describe('ProtocolSteps', () => {
  it('renders each component in ProtocolSteps', () => {
    vi.mocked(TimelineToolbox).mockReturnValue(<div>mock TimelineToolbox</div>)
    vi.mocked(DeckSetupContainer).mockReturnValue(
      <div>mock DeckSetupContainer</div>
    )

    render()
    screen.getByText('mock TimelineToolbox')
    screen.getByText('mock DeckSetupContainer')
  })
})
