import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { PromptGuide } from '../index'

const LABWARE_LIBRARY_URL = 'https://labware.opentrons.com/'

const render = () => {
  return renderWithProviders(<PromptGuide />, { i18nInstance: i18n })
}

describe('PromptGuide', () => {
  it('should render text', () => {
    render()
    screen.getByText('What type of protocol do you need?')
    screen.getByText(
      'Write a prompt in a natural language for OpentronsAI to generate a protocol using the Opentrons Python Protocol API v2. The better the prompt, the better the quality of the protocol produced by OpentronsAI.'
    )
    screen.getByText(
      'Here are some key pieces of information to provide in your prompt:'
    )
    screen.getByText('Robot type: Choose the OT-2 or Opentrons Flex.')
    screen.getByText(
      'Modules and adapters: Specify the modules and labware adapters required by your protocol.'
    )
    screen.getByText(/Labware and tip racks: Use names from the /)
    screen.getByText('Opentrons Labware Library')
    screen.getByText(
      'Liquid locations: Describe where liquids should go in the labware.'
    )
    screen.getByText(
      "Commands: List the protocol's steps, specifying quantities in microliters (uL) and giving exact source and destination locations."
    )
    screen.getByText('A few important things to note:')
    screen.getByText(
      'For example prompts, click the buttons in the left panel.'
    )
    screen.getByText(
      'Once OpentronsAI has written your protocol, type `simulate` in the prompt box to try it out.'
    )
    screen.getByText(
      'To start over and create a new protocol, simply reload the page.'
    )
  })
  it('should have the right url', () => {
    render()
    const link = screen.getByRole('link', { name: 'Opentrons Labware Library' })
    expect(link).toHaveAttribute('href', LABWARE_LIBRARY_URL)
  })
})
