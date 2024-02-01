import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { i18n } from '../../../../localization'
import { MetadataTile } from '../MetadataTile'
import type { FormState, WizardTileProps } from '../types'

const render = (props: React.ComponentProps<typeof MetadataTile>) => {
  return renderWithProviders(<MetadataTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    name: '',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  goBack: jest.fn(),
  proceed: jest.fn(),
  //  @ts-expect-error: need TS 4.3 or higher!!
  watch: jest.fn(name => values[name]),
  register: jest.fn(),
  formState: {
    errors: { fields: { name: null } },
    touchedFields: { fields: { name: true } },
  } as any,
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
    render(props)
    screen.getByText('Protocol name and description')
    screen.getByRole('heading', { name: 'Name your protocol.' })
    screen.getByText('Protocol Name *')
    screen.getByRole('heading', {
      name: 'Add more information, if you like (you can change this later).',
    })
    screen.getByText('Description')
    screen.getByText('Organization/Author')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
  it('renders protocol name input field and adding to it calls handleChange', () => {
    render(props)
    const input = screen.getAllByRole('textbox', { name: '' })[1]
    fireEvent.change(input, { target: { value: 'mockProtocolName' } })
    expect(props.register).toHaveBeenCalled()
  })
  it('renders org or author input field and adding to it calls handle change', () => {
    render(props)
    const input = screen.getAllByRole('textbox', { name: '' })[2]
    fireEvent.change(input, { target: { value: 'mock org' } })
    expect(props.register).toHaveBeenCalled()
  })
})
