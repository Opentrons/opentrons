import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import i18n from 'i18next'
import { renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { MetadataTile } from '../MetadataTile'
import type { FormState, WizardTileProps } from '../types'

const render = (props: React.ComponentProps<typeof MetadataTile>) => {
  return renderWithProviders(<MetadataTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockWizardTileProps: Partial<WizardTileProps> = {
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  goBack: jest.fn(),
  proceed: jest.fn(),
  values: {
    fields: {
      name: 'mockName',
      description: 'mockDescription',
      organizationOrAuthor: 'mockOrganizationOrAuthor',
      robotType: FLEX_ROBOT_TYPE,
    },
  } as FormState,
}

describe('MetadataTile', () => {
  let props: React.ComponentProps<typeof MetadataTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
  })
  it('renders the tile with all the information, expect back to be clickable but proceed disabled', () => {
    const { getByText, getByRole } = render(props)
    getByText('Protocol name and description')
    getByRole('heading', { name: 'Name your protocol.' })
    getByText('Protocol Name *')
    getByRole('heading', {
      name: 'Add more information, if you like (you can change this later).',
    })
    getByText('Description')
    getByText('mockDescription')
    getByText('Organization/Author')
    getByRole('button', { name: 'GoBack_button' }).click()
    expect(props.goBack).toHaveBeenCalled()
    expect(getByRole('button', { name: 'Next' })).toBeDisabled()
  })
  it('renders protocol name input field and adding to it calls handleChange', () => {
    const { getByLabelText } = render(props)
    const input = getByLabelText('MetadataTile_protocolName')
    fireEvent.change(input, { target: { value: 'mockProtocolName' } })
    expect(props.handleChange).toHaveBeenCalled()
  })
  it('renders org or author input field and adding to it calls handle change', () => {
    const { getByLabelText } = render(props)
    const input = getByLabelText('MetadataTile_orgOrAuth')
    fireEvent.change(input, { target: { value: 'mock org' } })
    expect(props.handleChange).toHaveBeenCalled()
  })
})
