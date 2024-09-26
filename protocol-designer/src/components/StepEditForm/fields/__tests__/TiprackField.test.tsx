import type * as React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { i18n } from '../../../../assets/localization'
import { getPipetteEntities } from '../../../../step-forms/selectors'
import { renderWithProviders } from '../../../../__testing-utils__'
import { getTiprackOptions } from '../../../../ui/labware/selectors'
import { TiprackField } from '../TiprackField'

vi.mock('../../../../ui/labware/selectors')
vi.mock('../../../../step-forms/selectors')

const render = (props: React.ComponentProps<typeof TiprackField>) => {
  return renderWithProviders(<TiprackField {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockMockId = 'mockId'
describe('TiprackField', () => {
  let props: React.ComponentProps<typeof TiprackField>

  beforeEach(() => {
    props = {
      disabled: false,
      value: null,
      name: 'tipRackt',
      updateValue: vi.fn(),
      onFieldBlur: vi.fn(),
      onFieldFocus: vi.fn(),
      pipetteId: mockMockId,
    }
    vi.mocked(getPipetteEntities).mockReturnValue({
      [mockMockId]: {
        name: 'p50_single_flex',
        spec: {} as any,
        id: mockMockId,
        tiprackLabwareDef: [],
        tiprackDefURI: ['mockDefURI1', 'mockDefURI2'],
      },
    })
    vi.mocked(getTiprackOptions).mockReturnValue([
      {
        value: 'mockDefURI1',
        name: 'tiprack1',
      },
      {
        value: 'mockDefURI2',
        name: 'tiprack2',
      },
    ])
  })
  it('renders the dropdown field and texts', () => {
    render(props)
    screen.getByText('tip rack')
    screen.getByText('tiprack1')
    screen.getByText('tiprack2')
  })
})
