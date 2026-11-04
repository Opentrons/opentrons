import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SlotSpotlightViewer } from '..'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import type { ComponentProps } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

vi.mock('../../SlotDetails', () => ({
  SlotDetails: () => <div>mock SlotDetails</div>,
}))

const render = (props: ComponentProps<typeof SlotSpotlightViewer>) => {
  return renderWithProviders(<SlotSpotlightViewer {...props} />, {
    i18nInstance: i18n,
  })
}

const mockRobotState = {} as RobotState
const mockInvariantContext = {} as InvariantContext
const mockAnalysis = {} as ProtocolAnalysisOutput

describe('SlotSpotlightViewer', () => {
  let props: ComponentProps<typeof SlotSpotlightViewer>

  beforeEach(() => {
    props = {
      appType: 'web',
      slotId: 'A1',
      robotState: mockRobotState,
      invariantContext: mockInvariantContext,
      analysis: mockAnalysis,
      liquids: [],
      onClose: vi.fn(),
    }
  })

  it('should render the slot label and Slot Spotlight title in the modal header', () => {
    render(props)
    expect(screen.getByTestId('RobotInfoLabel_A1')).toBeInTheDocument()
    expect(screen.getByText('Slot Spotlight')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby',
      'slot-spotlight-header'
    )
    expect(screen.getByText('mock SlotDetails')).toBeInTheDocument()
  })

  it('should map hopper fake locations to the real slot id on the slot label', () => {
    props.slotId = 'hopperA4'
    render(props)
    expect(screen.getByTestId('RobotInfoLabel_A4')).toBeInTheDocument()
    expect(
      screen.queryByTestId('RobotInfoLabel_hopperA4')
    ).not.toBeInTheDocument()
  })

  it('should return null for the desktop app', () => {
    props.appType = 'desktop'
    render(props)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Slot Spotlight')).not.toBeInTheDocument()
  })
})
