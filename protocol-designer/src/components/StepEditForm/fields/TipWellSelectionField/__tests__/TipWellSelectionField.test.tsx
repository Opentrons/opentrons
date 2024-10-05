import type * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getPipetteEntities } from '../../../../../step-forms/selectors'
import { WellSelectionModal } from '../../WellSelectionField/WellSelectionModal'
import { TipWellSelectionField } from '../index'

vi.mock('../../../../../step-forms/selectors')
vi.mock('../../WellSelectionField/WellSelectionModal')

const render = (props: React.ComponentProps<typeof TipWellSelectionField>) => {
  return renderWithProviders(<TipWellSelectionField {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockPipId = 'mockId'

describe('TipWellSelectionField', () => {
  let props: React.ComponentProps<typeof TipWellSelectionField>

  beforeEach(() => {
    props = {
      name: 'well',
      value: [],
      updateValue: vi.fn(),
      onFieldBlur: vi.fn(),
      onFieldFocus: vi.fn(),
      disabled: false,
      pipetteId: mockPipId,
      labwareId: 'mockLabwareId',
      nozzles: null,
    }
    vi.mocked(getPipetteEntities).mockReturnValue({
      [mockPipId]: {
        name: 'p50_single_flex',
        spec: {} as any,
        id: mockPipId,
        tiprackLabwareDef: [],
        tiprackDefURI: ['mockDefURI1', 'mockDefURI2'],
      },
    })
    vi.mocked(WellSelectionModal).mockReturnValue(
      <div>mock WellSelectionModal</div>
    )
  })
  it('renders the readOnly input field and clicking on it renders the modal', () => {
    render(props)
    screen.getByText('wells')
    fireEvent.click(screen.getByRole('textbox', { name: '' }))
    screen.getByText('mock WellSelectionModal')
  })
})
