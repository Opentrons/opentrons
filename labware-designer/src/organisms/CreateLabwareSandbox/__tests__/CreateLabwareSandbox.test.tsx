import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'

import { CreateLabwareSandbox } from '..'

describe('CreateLabwareSandbox', () => {
  it('renders irregular form by default', () => {
    render(<CreateLabwareSandbox />)
    expect(
      screen.getByRole('heading', { name: 'Render Irregular Labware' })
    ).toBeTruthy()

    const inputTextArea: HTMLTextAreaElement = screen.getByRole('textbox', {
      name: 'input options',
    })
    expect(inputTextArea.value).toContain('"format": "irregular"')
    const outputTextArea: HTMLTextAreaElement = screen.getByRole('textbox', {
      name: 'output definition',
    })
    expect(outputTextArea.value).toContain('"format": "irregular"')
  })
  it('renders regular form when selected', () => {
    render(<CreateLabwareSandbox />)

    const regularRadio = screen.getByRole('radio', { name: 'Regular' })
    fireEvent.click(regularRadio)
    expect(
      screen.getByRole('heading', { name: 'Render Regular Labware' })
    ).toBeTruthy()

    const inputTextArea: HTMLTextAreaElement = screen.getByRole('textbox', {
      name: 'input options',
    })
    expect(inputTextArea.value).toContain('"format": "96Standard"')
    const outputTextArea: HTMLTextAreaElement = screen.getByRole('textbox', {
      name: 'output definition',
    })
    expect(outputTextArea.value).toContain('"format": "96Standard"')
  })
  it('renders labware on deck by default and by itself after selected', () => {
    render(<CreateLabwareSandbox />)
    expect(screen.getByTestId('lw_on_deck')).toBeTruthy()
    expect(screen.queryByTestId('lw_by_itself')).toBeNull()

    const byItselfRadio = screen.getByRole('radio', { name: 'By Itself' })
    fireEvent.click(byItselfRadio)

    expect(screen.queryByTestId('lw_on_deck')).toBeNull()
    expect(screen.getByTestId('lw_by_itself')).toBeTruthy()
  })
  it('renders labware in first deck slot by default and by changes with selection', () => {
    render(<CreateLabwareSandbox />)
    const labwareRender: SVGGElement = screen.getByTestId('lw_on_deck') as any
    expect(labwareRender.getAttributeNS(null, 'transform')).toBe(
      'translate(0, 0)'
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 4 } })
    expect(labwareRender.getAttributeNS(null, 'transform')).not.toBe(
      'translate(0, 0)'
    )
  })
})
