import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { Storage } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof Storage>) =>
  renderWithProviders(<Storage {...props} />)

describe('Storage', () => {
  it('renders the label', () => {
    render({ label: 'File capacity', percentUsed: 50 })
    expect(screen.getByText('File capacity')).toBeInTheDocument()
  })

  it('renders correct used and available legend text', () => {
    render({ label: 'File capacity', percentUsed: 83 })
    expect(screen.getByText('83% used')).toBeInTheDocument()
    expect(screen.getByText('17% available')).toBeInTheDocument()
  })

  it('clamps percentUsed above 100 to 100', () => {
    render({ label: 'File capacity', percentUsed: 120 })
    expect(screen.getByText('100% used')).toBeInTheDocument()
    expect(screen.getByText('0% available')).toBeInTheDocument()
  })

  it('clamps percentUsed below 0 to 0', () => {
    render({ label: 'File capacity', percentUsed: -10 })
    expect(screen.getByText('0% used')).toBeInTheDocument()
    expect(screen.getByText('100% available')).toBeInTheDocument()
  })
})
