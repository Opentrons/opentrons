import type * as React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { fixture96Plate } from '@opentrons/shared-data'
import { SOURCE_WELL_BLOWOUT_DESTINATION } from '@opentrons/step-generation'
import { getLabwareEntities } from '../../../../step-forms/selectors'
import { renderWithProviders } from '../../../../__testing-utils__'
import { ZTipPositionModal } from '../TipPositionField/ZTipPositionModal'
import { BlowoutZOffsetField } from '../BlowoutZOffsetField'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../step-forms/selectors')
vi.mock('../TipPositionField/ZTipPositionModal')
const render = (props: React.ComponentProps<typeof BlowoutZOffsetField>) => {
  return renderWithProviders(<BlowoutZOffsetField {...props} />)[0]
}
const mockSourceId = 'sourceId'
describe('BlowoutZOffsetField', () => {
  let props: React.ComponentProps<typeof BlowoutZOffsetField>

  beforeEach(() => {
    props = {
      disabled: false,
      value: null,
      name: 'blowout_z_offset',
      updateValue: vi.fn(),
      onFieldBlur: vi.fn(),
      onFieldFocus: vi.fn(),
      destLabwareId: SOURCE_WELL_BLOWOUT_DESTINATION,
      sourceLabwareId: mockSourceId,
      blowoutLabwareId: 'blowoutId',
    }
    vi.mocked(getLabwareEntities).mockReturnValue({
      [mockSourceId]: {
        id: 'mockLabwareId',
        labwareDefURI: 'mock uri',
        def: fixture96Plate as LabwareDefinition2,
      },
    })
    vi.mocked(ZTipPositionModal).mockReturnValue(
      <div>mock ZTipPositionModal</div>
    )
  })
  it('renders the input field', () => {
    render(props)
    screen.getByTestId('BlowoutZOffsetField_blowout_z_offset')
  })
  it('renders the modal when input field is clicked on', () => {
    render(props)
    fireEvent.click(screen.getByTestId('BlowoutZOffsetField_blowout_z_offset'))
    screen.getByText('mock ZTipPositionModal')
  })
})
