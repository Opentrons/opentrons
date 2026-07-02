import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { BrowserRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import {
  DIRECTION_ROW,
  Flex,
  Icon,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { UploadInput } from '..'

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

  it('renders text when passing them as props', () => {
    const mockUploadText = (
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
        <LegacyStyledText>{'CSV file'}</LegacyStyledText>
        <Icon name="information" size="0.75rem" data-testid="mockIcon" />
      </Flex>
    )

    renderWithProviders(
      <BrowserRouter>
        <UploadInput
          onUpload={onUpload}
          uploadButtonText="Choose file"
          uploadText={mockUploadText}
        />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )

    screen.getByText('CSV file')
    screen.getByTestId('mockIcon')
    screen.getByText('Choose file')
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
    const dropZone = screen.getByLabelText('File upload drop zone')
    const fileInput = dropZone.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    if (fileInput == null) {
      throw new Error('Input element not found')
    }
    fileInput.click = vi.fn()
    fireEvent.click(button)
    expect(fileInput.click).toHaveBeenCalled()
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
    const dropZone = screen.getByLabelText('File upload drop zone')
    fireEvent.drop(dropZone, {
      dataTransfer: { files: ['dummyFile'] },
    })
    expect(onUpload).toHaveBeenCalledWith('dummyFile')
  })
})
