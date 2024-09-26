import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFormContext } from 'react-hook-form'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { SidePanel } from '../index'

vi.mock('react-hook-form')

const LOGO_FILE_NAME =
  '/opentrons-ai-client/src/assets/images/opentrons_logo.svg'

const FEEDBACK_FORM_LINK = 'https://opentrons-ai-beta.paperform.co/'

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<SidePanel />, {
    i18nInstance: i18n,
  })
}

describe('SidePanel', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(useFormContext).mockReturnValue({
      setValue: vi.fn(),
    } as any)
  })
  it('should render logo and text', () => {
    render()
    const image = screen.getByRole('img')
    expect(image.getAttribute('src')).toEqual(LOGO_FILE_NAME)
    screen.getByText(
      'Use natural language to generate protocols with OpentronsAI powered by OpenAI'
    )
    screen.getByText(
      'Write a prompt in natural language to generate a Reagent Transfer or a PCR protocol for the OT-2 or Opentrons Flex using the Opentrons Python Protocol API.'
    )
    screen.getByText('Stuck? Try these example prompts to get started.')
    screen.getByText('Got feedback? We love to hear it.')
    const link = screen.getByRole('link', {
      name: 'Share your thoughts here',
    })
    expect(link).toHaveAttribute('href', FEEDBACK_FORM_LINK)
  })

  it('should render buttons', () => {
    render()
    screen.getByRole('button', { name: 'PCR' })
    screen.getByRole('button', { name: 'PCR (Flex)' })
    screen.getByRole('button', { name: 'Reagent Transfer' })
    screen.getByRole('button', { name: 'Reagent Transfer (Flex)' })
  })
  it.todo('should call a mock function when clicking a button')
})
