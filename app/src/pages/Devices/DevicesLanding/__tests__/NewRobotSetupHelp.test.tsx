import * as React from 'react'
import { it, describe, expect } from 'vitest'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { NewRobotSetupHelp } from '../NewRobotSetupHelp'

const render = () => {
  return renderWithProviders(<NewRobotSetupHelp />, {
    i18nInstance: i18n,
  })
}

describe('NewRobotSetupHelp', () => {
  it('renders link and collapsed modal by default', () => {
    const [{ getByText, queryByText }] = render()

    getByText('See how to set up a new robot')
    expect(queryByText('How to setup a new robot')).toBeFalsy()
  })
  it('when link is clicked, modal is opened, and closes via Close button', () => {
    const [{ getByText, getByRole, queryByText }] = render()

    const link = getByText('See how to set up a new robot')
    fireEvent.click(link)
    getByText('How to setup a new robot')

    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)

    expect(queryByText('How to setup a new robot')).toBeFalsy()
  })
  it('when link is clicked, modal is opened, and closes via x', () => {
    const [{ getByText, getByRole, queryByText }] = render()

    const link = getByText('See how to set up a new robot')
    fireEvent.click(link)
    expect(getByText('How to setup a new robot')).toBeInTheDocument()

    const xButton = getByRole('button', { name: '' })
    fireEvent.click(xButton)

    expect(queryByText('How to setup a new robot')).toBeFalsy()
  })
})
