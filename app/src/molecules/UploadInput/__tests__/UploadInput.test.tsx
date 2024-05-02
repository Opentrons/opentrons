import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { UploadInput } from '..'
import { renderWithProviders } from '../../../__testing-utils__'

describe('UploadInput', () => {
  let onUpload: any

  beforeEach(() => {
    onUpload = vi.fn()
  })
  it('renders correct contents for empty state', () => {
    renderWithProviders(
      <BrowserRouter>
        <UploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )

    expect(screen.getByRole('button', { name: 'Upload' })).toBeTruthy()
  })

  it('opens file select on button click', () => {
    renderWithProviders(
      <BrowserRouter>
        <UploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )
    const button = screen.getByRole('button', { name: 'Upload' })
    const input = screen.getByTestId('file_input')
    input.click = vi.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
  it('calls create session on choose file', () => {
    renderWithProviders(
      <BrowserRouter>
        <UploadInput onUpload={onUpload} />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )
    const input = screen.getByTestId('file_input')
    fireEvent.change(input, { target: { files: ['dummyFile'] } })
    expect(onUpload).toHaveBeenCalledWith('dummyFile')
  })
})
