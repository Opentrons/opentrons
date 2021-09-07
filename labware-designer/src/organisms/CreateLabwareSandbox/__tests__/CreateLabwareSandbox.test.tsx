import * as React from 'react'
import '@testing-library/jest-dom'
import { render, fireEvent } from '@testing-library/react'

import { CreateLabwareSandbox } from '..'

describe('CreateLabwareSandbox', () => {
  it('renders irregular form by default', () => {
    const { getByRole } = render(<CreateLabwareSandbox />)
    expect(
      getByRole('heading', { name: 'Render Irregular Labware' })
    ).toBeTruthy()

    const inputTextArea: HTMLTextAreaElement = getByRole('textbox', {
      name: 'input options',
    }) as any
    expect(inputTextArea.value).toContain('"format": "irregular"')
    const outputTextArea: HTMLTextAreaElement = getByRole('textbox', {
      name: 'output definition',
    }) as any
    expect(outputTextArea.value).toContain('"format": "irregular"')
  })
  it('renders regular form when selected', () => {
    const { getByRole } = render(<CreateLabwareSandbox />)

    const regularRadio = getByRole('radio', { name: 'Regular' })
    fireEvent.click(regularRadio)
    expect(
      getByRole('heading', { name: 'Render Regular Labware' })
    ).toBeTruthy()

    const inputTextArea: HTMLTextAreaElement = getByRole('textbox', {
      name: 'input options',
    }) as any
    expect(inputTextArea.value).toContain('"format": "96Standard"')
    const outputTextArea: HTMLTextAreaElement = getByRole('textbox', {
      name: 'output definition',
    }) as any
    expect(outputTextArea.value).toContain('"format": "96Standard"')
  })
  it('renders labware on deck by default and by itself after selected', () => {
    const { getByTestId, getByRole, queryByTestId } = render(
      <CreateLabwareSandbox />
    )
    expect(getByTestId('lw_on_deck')).toBeTruthy()
    expect(queryByTestId('lw_by_itself')).toBeNull()

    const byItselfRadio = getByRole('radio', { name: 'By Itself' })
    fireEvent.click(byItselfRadio)

    expect(queryByTestId('lw_on_deck')).toBeNull()
    expect(getByTestId('lw_by_itself')).toBeTruthy()
  })
  it('renders labware in first deck slot by default and by changes with selection', () => {
    const { getByTestId, getByRole } = render(<CreateLabwareSandbox />)
    const labwareRender: SVGGElement = getByTestId('lw_on_deck') as any
    expect(labwareRender.getAttributeNS(null, 'transform')).toBe(
      'translate(0, 0)'
    )

    fireEvent.change(getByRole('combobox'), { target: { value: 4 } })
    expect(labwareRender.getAttributeNS(null, 'transform')).not.toBe(
      'translate(0, 0)'
    )
  })
})
