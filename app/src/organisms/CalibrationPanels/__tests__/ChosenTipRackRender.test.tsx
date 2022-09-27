import * as React from 'react'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { ChosenTipRackRender } from '../ChosenTipRackRender'
import type { SelectOption } from '../../../atoms/SelectField/Select'

const render = (props: React.ComponentProps<typeof ChosenTipRackRender>) => {
  return renderWithProviders(<ChosenTipRackRender {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockSelectValue = {
  value: 'opentrons_96_tiprack_1000ul',
  label: 'Opentrons 96 tip rack 1000ul',
} as SelectOption

describe('ChosenTipRackRender', () => {
  let props: React.ComponentProps<typeof ChosenTipRackRender>
  beforeEach(() => {
    props = {
      selectedValue: mockSelectValue,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders text and image alt text when tip rack is Opentrons 96 1000uL', () => {
    const { getByText, getByAltText } = render(props)
    getByText('Opentrons 96 tip rack 1000ul')
    getByAltText('Opentrons 96 tip rack 1000ul image')
  })
})
