import type * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fixture96Plate } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getLabwareEntities } from '../../../../../step-forms/selectors'
import { ZTipPositionModal } from '../ZTipPositionModal'
import { TipPositionModal } from '../TipPositionModal'
import { TipPositionField } from '../index'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../../step-forms/selectors')
vi.mock('../ZTipPositionModal')
vi.mock('../TipPositionModal')
const render = (props: React.ComponentProps<typeof TipPositionField>) => {
  return renderWithProviders(<TipPositionField {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockDelay = 'aspirate_delay_mmFromBottom'
const mockAspirate = 'aspirate_mmFromBottom'
const mockLabwareId = 'mockId'
describe('TipPositionField', () => {
  let props: React.ComponentProps<typeof TipPositionField>

  beforeEach(() => {
    props = {
      zField: mockDelay,
      labwareId: mockLabwareId,
      propsForFields: {
        [mockDelay]: {
          name: mockDelay,
          value: null,
          updateValue: vi.fn(),
          tooltipContent: 'mock content',
          isIndeterminate: false,
          disabled: false,
        } as any,
      },
    }
    vi.mocked(TipPositionModal).mockReturnValue(
      <div>mock TipPositionModal</div>
    )
    vi.mocked(ZTipPositionModal).mockReturnValue(
      <div>mock ZTipPositionModal</div>
    )
    vi.mocked(getLabwareEntities).mockReturnValue({
      [mockLabwareId]: {
        id: mockLabwareId,
        labwareDefURI: 'mock uri',
        def: fixture96Plate as LabwareDefinition2,
      },
    })
  })
  it('renders the input field and header when x and y fields are not provided', () => {
    render(props)
    screen.getByText('mm')
    fireEvent.click(screen.getByRole('textbox', { name: '' }))
    expect(screen.getByRole('textbox', { name: '' })).not.toBeDisabled()
    screen.getByText('mock ZTipPositionModal')
  })
  it('renders the input field but it is disabled', () => {
    props = {
      ...props,
      propsForFields: {
        [mockDelay]: {
          name: mockDelay,
          value: null,
          updateValue: vi.fn(),
          tooltipContent: 'mock content',
          isIndeterminate: false,
          disabled: true,
        } as any,
      },
    }
    render(props)
    expect(screen.getByRole('textbox', { name: '' })).toBeDisabled()
  })
  it('renders the icon when x,y, and z fields are provided', () => {
    const mockX = 'aspirate_x_position'
    const mockY = 'aspirate_y_position'
    props = {
      zField: mockAspirate,
      xField: mockX,
      yField: mockY,
      labwareId: mockLabwareId,
      propsForFields: {
        [mockAspirate]: {
          name: mockAspirate,
          value: null,
          updateValue: vi.fn(),
          tooltipContent: 'mock content',
          isIndeterminate: false,
          disabled: false,
        } as any,
        [mockX]: {
          name: mockX,
          value: null,
          updateValue: vi.fn(),
        } as any,
        [mockY]: {
          name: mockY,
          value: null,
          updateValue: vi.fn(),
        } as any,
      },
    }
    render(props)
    fireEvent.click(screen.getByTestId('TipPositionIcon_aspirate_mmFromBottom'))
    screen.getByText('mock TipPositionModal')
  })
})
