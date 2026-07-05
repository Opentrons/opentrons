import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'

import { ExternalLink } from '../ExternalLink'

import type { ComponentProps } from 'react'

const TEST_URL = 'https://opentrons.com'

const render = (props: ComponentProps<typeof ExternalLink>) => {
  return renderWithProviders(<ExternalLink {...props} />)[0]
}

describe('ExternalLink', () => {
  let props: ComponentProps<typeof ExternalLink>

  beforeEach(() => {
    props = {
      href: TEST_URL,
      id: 'test-link',
      children: 'Test Link',
    }
  })

  it('renders external link', () => {
    render(props)

    const link = screen.getByRole('link', { name: 'Test Link' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://opentrons.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveStyle(`color: ${COLORS.blue50}`)
  })
})
