import React from 'react'
import { vi, describe, it, expect } from 'vitest'
import { FormikConfig } from 'formik'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { CreateNewDefinition } from '../../sections/CreateNewDefinition'

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: vi.fn(),
}

describe('CreateNewDefinition', () => {
  it('should render with the correct information', () => {
    const fakeLabwareTypeChildFields = <div data-testid="fakeChildField" />
    const props = {
      showDropDownOptions: true,
      disabled: false,
      labwareTypeChildFields: fakeLabwareTypeChildFields,
      onClick: () => { },
    }
    const { getByRole, getByText, getByTestId } = render(
      wrapInFormik(<CreateNewDefinition {...props} />, formikConfig)
    )

    expect(getByRole('heading')).toHaveTextContent(/create a new definition/i)
    expect(getByText(/what type of labware are you creating\?/i)).toBeTruthy()
    expect(getByRole('button')).toHaveTextContent(/start creating labware/i)

    getByTestId('fakeChildField')

    const labwareTypeDropdown = getByRole('combobox', {
      name: /what type of labware are you creating\?.*/i,
    })
    expect(labwareTypeDropdown).toHaveValue('')
    fireEvent.change(labwareTypeDropdown, { target: { value: 'wellPlate' } })
    expect(labwareTypeDropdown).toHaveValue('wellPlate')
  })

  it('should disable the button when its disabled prop is true', () => {
    const props = {
      showDropDownOptions: true,
      disabled: true,
      labwareTypeChildFields: null,
      onClick: () => { },
    }
    const { getByRole } = render(
      wrapInFormik(<CreateNewDefinition {...props} />, formikConfig)
    )

    const createButton = getByRole('button')
    expect(createButton).toBeDisabled()
  })

  it('should not render the dropdown when its showDropDownOptions prop is false', () => {
    const props = {
      showDropDownOptions: false,
      disabled: true,
      labwareTypeChildFields: null,
      onClick: () => { },
    }
    const { queryByRole } = render(
      wrapInFormik(<CreateNewDefinition {...props} />, formikConfig)
    )

    expect(queryByRole('combobox')).toBe(null)
  })
})
