import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../localization'
import { BatchEditMoveLiquid } from '../BatchEditMoveLiquid'
import { WellOrderField } from '../../StepEditForm/fields'

jest.mock('../../StepEditForm/fields')

const mockWellOrderField = WellOrderField as jest.MockedFunction<
  typeof WellOrderField
>

const render = (props: React.ComponentProps<typeof BatchEditMoveLiquid>) => {
  return renderWithProviders(<BatchEditMoveLiquid {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('BatchEditMoveLiquid ', () => {
  let props: React.ComponentProps<typeof BatchEditMoveLiquid>

  beforeEach(() => {
    props = {
      handleCancel: jest.fn(),
      handleSave: jest.fn(),
      batchEditFormHasChanges: false,
      propsForFields: {
        aspirate: {
          disabled: false,
          name: 'aspirate',
          onFieldBlur: jest.fn(),
          onFieldFocus: jest.fn(),
          updateValue: jest.fn(),
          value: 'l2r',
        },
        dispense: {
          disabled: false,
          name: 'dispense',
          onFieldBlur: jest.fn(),
          onFieldFocus: jest.fn(),
          updateValue: jest.fn(),
          value: 'l2r',
        },
      },
    }
    mockWellOrderField.mockReturnValue(<div>mock WellOrderField</div>)
  })
  it('renders the move liquid form with all the information', () => {
    render(props)
    screen.getByText('tea')
  })
})
