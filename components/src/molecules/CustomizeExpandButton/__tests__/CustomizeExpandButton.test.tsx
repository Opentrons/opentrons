import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture24Tuberack, fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../testing/utils'
import { CustomizeExpandButton } from '../index'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof CustomizeExpandButton>) =>
  renderWithProviders(<CustomizeExpandButton {...props} />)

const INPUT_FIELD_PROPS = {
  onInputFieldChange: vi.fn(),
  inputFieldValue: 1,
  inputTitle: 'mock inputTitle',
  errorMessage: 'mock errorMessage',
  inputCaption: 'mock inputCaption',
  definition: { ...fixture96Plate, stackLimit: 4 } as LabwareDefinition2,
}

describe('CustomizeExpandButton', () => {
  let props: ComponentProps<typeof CustomizeExpandButton>

  beforeEach(() => {
    props = {
      enableStackingFF: true,
      buttonText: 'mock text',
      buttonValue: 'mockValue',
      onChange: vi.fn(),
      allowInputField: false,
      isNestedDefALid: false,
    }
  })

  it('should render non nested accordion', () => {
    render(props)
    fireEvent.click(screen.getByText('mock text'))
    expect(props.onChange).toHaveBeenCalled()
  })
  it('should render the input field', () => {
    props = {
      ...props,
      allowInputField: true,
      isSelected: true,
      stackingProps: INPUT_FIELD_PROPS,
    }
    render(props)
    screen.getByText('mock inputTitle')
    screen.getByText('mock inputCaption')
    const input = screen.getByTestId('CustomizeExpandButton_inputField')
    fireEvent.change(input, { target: { value: 4 } })
    expect(props.stackingProps?.onInputFieldChange).toHaveBeenCalled()
  })
  it('should show input field error', () => {
    props = {
      ...props,
      allowInputField: true,
      isSelected: true,
      stackingProps: {
        ...INPUT_FIELD_PROPS,
        inputFieldValue: 5,
      },
    }
    render(props)
    screen.getByText('mock errorMessage')
  })
  it('should render the checkbox', () => {
    props = {
      ...props,
      isSelected: true,
      stackingProps: {
        ...INPUT_FIELD_PROPS,
        definition: {
          ...fixture24Tuberack,
          allowedRoles: ['lid'],
        } as LabwareDefinition2,
        onCheckboxChange: vi.fn(),
        checked: false,
        checkboxCaption: 'mock checkboxCaption',
      },
    }
    render(props)
    screen.getByText('mock checkboxCaption')
  })
})
