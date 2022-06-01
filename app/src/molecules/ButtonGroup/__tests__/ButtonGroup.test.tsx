import * as React from 'react'
import { render } from '@testing-library/react'
import { ButtonGroup } from '..'
import { PrimaryButton } from '../../../atoms/buttons'

describe('ButtonGroup', () => {
  it('renders ButtonGroup with PrimaryButtons', () => {
    const { getByRole } = render(
      <ButtonGroup>
        <PrimaryButton>Map View</PrimaryButton>
        <PrimaryButton>List View</PrimaryButton>
      </ButtonGroup>
    )

    const mapViewButton = getByRole('button', { name: 'Map View' })
    const listViewButton = getByRole('button', { name: 'List View' })

    expect(mapViewButton).toBeEnabled()
    expect(listViewButton).toBeEnabled()
  })

  it('renders ButtonGroup with a disabled PrimaryButtons', () => {
    const { getByRole } = render(
      <ButtonGroup>
        <PrimaryButton disabled>Map View</PrimaryButton>
        <PrimaryButton>List View</PrimaryButton>
      </ButtonGroup>
    )

    const mapViewButton = getByRole('button', { name: 'Map View' })
    const listViewButton = getByRole('button', { name: 'List View' })

    expect(mapViewButton).toBeDisabled()
    expect(listViewButton).toBeEnabled()
  })
})
