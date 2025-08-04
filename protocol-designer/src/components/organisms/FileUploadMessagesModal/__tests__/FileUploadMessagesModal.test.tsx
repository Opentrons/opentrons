import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FileUploadMessagesModal } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import {
  dismissFileUploadMessage,
  undoLoadFile,
} from '../../../../load-file/actions'
import { getFileUploadMessages } from '../../../../load-file/selectors'

vi.mock('../../../../load-file/selectors')
vi.mock('../../../../load-file/actions')
vi.mock('../../../../feature-flags/selectors')

const render = () => {
  return renderWithProviders(<FileUploadMessagesModal />, {
    i18nInstance: i18n,
  })[0]
}

describe('FileUploadMessagesModal', () => {
  beforeEach(() => {
    vi.mocked(getFileUploadMessages).mockReturnValue({
      isError: true,
      errorType: 'INVALID_FILE_TYPE',
    })
  })
  it('renders modal for a non-JSON and non-python file', () => {
    render()
    screen.getByText('Invalid file type')
    screen.getByText(
      'Protocol Designer only accepts JSON and Python protocol files created with Protocol Designer. Upload a valid file to continue.'
    )
  })
  it('renders modal for a migration', () => {
    vi.mocked(getFileUploadMessages).mockReturnValue({
      isError: false,
      messageKey: 'DID_MIGRATE',
      migrationsRan: ['8.5.0'],
    })
    render()
    screen.getByText(
      'Your protocol was made in an older version of Protocol Designer'
    )
    screen.getByText(
      'Your protocol and included labware will be automatically updated to the latest version. We recommend making a separate copy of your file before importing.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(vi.mocked(dismissFileUploadMessage)).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(vi.mocked(undoLoadFile)).toHaveBeenCalled()
  })
  it('renders modal for an invalid JSON file', () => {
    vi.mocked(getFileUploadMessages).mockReturnValue({
      isError: true,
      errorType: 'INVALID_JSON_FILE',
      errorMessage: 'mock error message',
    })
    render()
    screen.getByText('Invalid JSON file')
    screen.getByText(
      'This JSON file is either missing required information or contains sections that Protocol Designer cannot read. At this time we do not support JSON files created outside of Protocol Designer.'
    )
    screen.getByText('Error message:')
    screen.getByText('mock error message')
  })
  it('renders modal for python file missing the DESGINER_APPLICATION blob', () => {
    vi.mocked(getFileUploadMessages).mockReturnValue({
      isError: true,
      errorType: 'INVALID_PYTHON_FILE',
    })
    render()
    screen.getByText('Unable to import')
    screen.getByText(
      'This protocol file has been modified after export and can’t be imported. Please use the original, unedited file created in Protocol Designer.'
    )
  })
  it('renders modal for invalid Python file', () => {
    vi.mocked(getFileUploadMessages).mockReturnValue({
      isError: true,
      errorType: 'INVALID_PYTHON_FILE',
      errorMessage: 'mock error message',
    })
    render()
    screen.getByText('Unable to import')
    screen.getByText(
      'Protocol files must be created in Protocol Designer to be compatible.'
    )
    screen.getByText('Error message:')
    screen.getByText('mock error message')
  })
})
