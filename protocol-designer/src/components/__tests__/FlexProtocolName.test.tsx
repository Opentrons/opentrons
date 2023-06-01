import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { useFormikContext } from 'formik'
import {
  FlexProtocolNameComponent,
  flexProtocolName,
} from '../FlexProtocolEditor/FlexPillForm/FlexProtocolName'

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}))

describe('FlexProtocolNameComponent', () => {
  const handleChange = jest.fn()
  const handleBlur = jest.fn()

  beforeEach(() => {
    ;(useFormikContext as jest.Mock).mockReturnValue({
      values: {
        fields: {
          name: '',
          author: '',
          description: '',
        },
      },
      errors: {},
      touched: {},
      handleChange,
      handleBlur,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders FlexProtocolNameComponent without errors/crashing', () => {
    render(<FlexProtocolNameComponent />)
  })

  it('renders protocol name input field', () => {
    const { container } = render(<FlexProtocolNameComponent />)
    const protocolNameInput = screen.getByTestId('protocol-name-input')

    expect(protocolNameInput).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('renders organization author input field', () => {
    const { container } = render(<FlexProtocolNameComponent />)
    const organizationAuthorInput = screen.getByTestId(
      'organization-author-input'
    )

    expect(organizationAuthorInput).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('renders protocol description textarea', () => {
    const { container } = render(<FlexProtocolNameComponent />)
    const protocolDescriptionTextarea = screen.getByTestId(
      'protocol-description-textarea'
    )

    expect(protocolDescriptionTextarea).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('renders protocol name input field with initial focus', () => {
    const { getByTestId, container } = render(<FlexProtocolNameComponent />)
    const protocolNameInput = getByTestId('protocol-name-input')

    expect(protocolNameInput).toHaveFocus()
    expect(container).toMatchSnapshot()
  })

  it('updates protocol name input field value', () => {
    const { values } = useFormikContext<flexProtocolName>()
    values.fields.name = 'New Protocol Name'
    const { container } = render(<FlexProtocolNameComponent />)
    const protocolNameInput = screen.getByTestId(
      'protocol-name-input'
    ) as HTMLInputElement

    fireEvent.change(protocolNameInput, {
      target: { value: 'New Protocol Name' },
    })

    expect(protocolNameInput.value).toBe('New Protocol Name')
    expect(container).toMatchSnapshot()
  })

  it('updates organization author input field value', () => {
    const { values } = useFormikContext<flexProtocolName>()
    values.fields.author = 'New Organization Author'

    const { container } = render(<FlexProtocolNameComponent />)
    const organizationAuthorInput = screen.getByTestId(
      'organization-author-input'
    ) as HTMLInputElement

    fireEvent.change(organizationAuthorInput, {
      target: { value: 'New Organization Author' },
    })

    expect(organizationAuthorInput.value).toBe('New Organization Author')
    expect(container).toMatchSnapshot()
  })

  it('updates protocol description textarea value', () => {
    const { values } = useFormikContext<flexProtocolName>()
    values.fields.description = 'New Protocol Description'
    const { container } = render(<FlexProtocolNameComponent />)
    const protocolDescriptionTextarea = screen.getByTestId(
      'protocol-description-textarea'
    ) as HTMLTextAreaElement

    fireEvent.change(protocolDescriptionTextarea, {
      target: { value: 'New Protocol Description' },
    })

    expect(protocolDescriptionTextarea.value).toBe('New Protocol Description')
    expect(container).toMatchSnapshot()
  })
})
