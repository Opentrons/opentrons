import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getPipetteEntities } from '/protocol-designer/step-forms/selectors'
import { getDisposalOptions } from '/protocol-designer/ui/labware/selectors'

import { DisposalField } from '../DisposalField'
import { FlowRateField } from '../FlowRateField'
import { PositionField } from '../PositionField'

import type { ComponentProps } from 'react'
import type { FieldProps } from '../../types'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/ui/labware/selectors')
vi.mock('../FlowRateField')
vi.mock('../PositionField')

const aspirateLabwareId = 'mockAspirateLabwareId'
const dispenseLabwareId = 'mockDispenseLabwareId'
const trashBinId = 'mockTrashBinId'

const makeFieldProps = (name: string, value: unknown): FieldProps => ({
  name,
  value,
  updateValue: vi.fn(),
  onFieldBlur: vi.fn(),
  onFieldFocus: vi.fn(),
  disabled: false,
  errorToShow: null,
  tooltipContent: null,
  isIndeterminate: false,
})

const makePropsForFields = (
  blowoutLocation: string
): Record<string, FieldProps> => ({
  disposalVolume_checkbox: makeFieldProps('disposalVolume_checkbox', true),
  disposalVolume_volume: makeFieldProps('disposalVolume_volume', '5'),
  blowout_location: makeFieldProps('blowout_location', blowoutLocation),
  blowout_flowRate: makeFieldProps('blowout_flowRate', null),
  volume: makeFieldProps('volume', '30'),
  tipRack: makeFieldProps('tipRack', 'mockTipRack'),
  aspirate_labware: makeFieldProps('aspirate_labware', aspirateLabwareId),
  dispense_labware: makeFieldProps('dispense_labware', dispenseLabwareId),
})

const render = (props: ComponentProps<typeof DisposalField>) => {
  return renderWithProviders(<DisposalField {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisposalField', () => {
  let props: ComponentProps<typeof DisposalField>

  beforeEach(() => {
    props = {
      path: 'multiDispense',
      pipette: null,
      formData: { tipRack: 'mockTipRack' } as any,
      propsForFields: makePropsForFields(SOURCE_WELL_BLOWOUT_DESTINATION),
      stepType: 'moveLiquid',
      volume: '30',
      aspirate_airGap_checkbox: false,
      aspirate_airGap_volume: null,
    }
    vi.mocked(getDisposalOptions).mockReturnValue([
      { name: 'Trash bin', value: trashBinId },
    ])
    vi.mocked(getPipetteEntities).mockReturnValue({})
    vi.mocked(FlowRateField).mockReturnValue(<div>mock FlowRateField</div>)
    vi.mocked(PositionField).mockReturnValue(<div>mock PositionField</div>)
  })

  it('renders the disposal volume, blowout location, flow rate, and position fields for a source well blowout', () => {
    render(props)
    screen.getAllByText('Disposal volume')
    screen.getByText('Blowout location')
    screen.getByText('mock FlowRateField')
    screen.getByText('mock PositionField')
    expect(vi.mocked(PositionField)).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'blowout',
        zField: 'blowout_mmFromBottom',
        xField: 'blowout_x_position',
        yField: 'blowout_y_position',
        referenceField: 'blowout_position_reference',
        labwareId: aspirateLabwareId,
      }),
      expect.anything()
    )
  })

  it('renders the position field bound to the dispense labware for a destination well blowout', () => {
    props.propsForFields = makePropsForFields(DEST_WELL_BLOWOUT_DESTINATION)
    render(props)
    screen.getByText('mock PositionField')
    expect(vi.mocked(PositionField)).toHaveBeenCalledWith(
      expect.objectContaining({ labwareId: dispenseLabwareId }),
      expect.anything()
    )
  })

  it('does not render the position field when the blowout location is a trash bin', () => {
    props.propsForFields = makePropsForFields(trashBinId)
    render(props)
    screen.getByText('mock FlowRateField')
    expect(screen.queryByText('mock PositionField')).toBeNull()
  })

  it('does not render any fields when the disposal volume checkbox is unchecked', () => {
    props.propsForFields.disposalVolume_checkbox = makeFieldProps(
      'disposalVolume_checkbox',
      false
    )
    render(props)
    expect(screen.queryByText('Blowout location')).toBeNull()
    expect(screen.queryByText('mock PositionField')).toBeNull()
  })
})
