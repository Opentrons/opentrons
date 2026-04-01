import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { InputStepFormField } from '/protocol-designer/components/molecules'

import { PositionField } from '../../../PipetteFields'
import { MultiInputField } from '../MultiInputField'

import type { ComponentProps } from 'react'

vi.mock('../../../PipetteFields')
vi.mock('/protocol-designer/components/molecules')

const render = (props: ComponentProps<typeof MultiInputField>) => {
  return renderWithProviders(<MultiInputField {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MultiInputField', () => {
  let props: ComponentProps<typeof MultiInputField>

  beforeEach(() => {
    props = {
      formData: {
        stepType: 'moveLiquid',
        id: 'mockFormId',
      },
      name: 'Retract',
      tooltipContent: 'some tooltip content',
      prefix: 'aspirate_retract',
      fields: [
        {
          fieldTitle: 'retract speed',
          fieldKey: 'aspirate_retract_speed',
          units: 'mm/s',
        },
        {
          fieldTitle: 'retract delay seconds',
          fieldKey: 'aspirate_retract_delay_seconds',
          units: 'mm',
        },
      ],
      propsForFields: {},
    }
    vi.mocked(InputStepFormField).mockReturnValue(
      <div>mock InputStepFormField</div>
    )
    vi.mocked(PositionField).mockReturnValue(<div>mock PositionField</div>)
  })

  it('should render a caption with InputStepFromFields wrapped by ListItem', () => {
    render(props)
    screen.getByText('Retract')
    const listItem = screen.getByTestId('ListItem_default')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.grey20}`)
    screen.getAllByText('mock InputStepFormField')
    expect(screen.queryByText('mock PositionField')).not.toBeInTheDocument()
  })

  it('should render a well position component when isWellPosition is true', () => {
    props.isWellPosition = true
    props.labwareId = 'mockID'
    render(props)
    screen.getAllByText('mock InputStepFormField')
    screen.getByText('mock PositionField')
  })
})
