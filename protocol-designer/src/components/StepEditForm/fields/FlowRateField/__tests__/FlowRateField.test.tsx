import type * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { fixtureP100096V2Specs } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getPipetteEntities } from '../../../../../step-forms/selectors'
import { FlowRateField } from '../index'

vi.mock('../../../../../step-forms/selectors')
const render = (props: React.ComponentProps<typeof FlowRateField>) => {
  return renderWithProviders(<FlowRateField {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockMockId = 'mockId'
describe('FlowRateField', () => {
  let props: React.ComponentProps<typeof FlowRateField>

  beforeEach(() => {
    props = {
      disabled: false,
      flowRateType: 'aspirate',
      volume: 100,
      value: null,
      name: 'flowRate',
      tiprack: 'tipRack:opentrons_flex_96_tiprack_1000ul',
      updateValue: vi.fn(),
      onFieldBlur: vi.fn(),
      onFieldFocus: vi.fn(),
      pipetteId: mockMockId,
    }
    vi.mocked(getPipetteEntities).mockReturnValue({
      [mockMockId]: {
        name: 'p50_single_flex',
        spec: {
          liquids: fixtureP100096V2Specs.liquids,
          displayName: 'mockPipDisplayName',
        } as any,
        id: mockMockId,
        tiprackLabwareDef: [
          {
            parameters: {
              loadName: 'opentrons_flex_96_tiprack_1000ul',
              tipLength: 1000,
            },
            metadata: { displayName: 'mockDisplayName' },
          } as any,
        ],
        tiprackDefURI: ['mockDefURI1', 'mockDefURI2'],
      },
    })
  })
  it('renders the flowRateInput and clicking on it opens the modal with all the text', () => {
    render(props)
    screen.getByText('Flow Rate')
    fireEvent.click(screen.getByRole('textbox'))
    screen.getByText(
      'The default mockPipDisplayName flow rate is optimal for handling aqueous liquids'
    )
    screen.getByText('aspirate speed')
    screen.getByText('160 μL/s (default)')
    screen.getByText('Custom')
    screen.getByText('between 0.1 and Infinity')
    screen.getByText('Cancel')
    screen.getByText('Done')
  })
  it('renders the information for blowout field', () => {
    props.flowRateType = 'blowout'
    render(props)
    expect(screen.queryByText('Flow Rate')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('textbox'))
    screen.getByText(
      'The default mockPipDisplayName flow rate is optimal for handling aqueous liquids'
    )
    screen.getByText('blowout speed')
    screen.getByText('80 μL/s (default)')
    screen.getByText('Custom')
    screen.getByText('between 0.1 and Infinity')
    screen.getByText('Cancel')
    screen.getByText('Done')
  })
})
