import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useHandleRobotCertImport } from '/app/organisms/Desktop/RobotCertImport/useHandleRobotCertImport'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import { RobotCertImportModal } from '../RobotCertImportModal'

vi.mock('/app/resources/client_data/encryptionKeys')
vi.mock('/app/organisms/Desktop/RobotCertImport/useHandleRobotCertImport')

const mockClearKeyDisplay = vi.fn()
const mockOnClose = vi.fn()
const mockSetPasswordValue = vi.fn()
const mockTryImport = vi.fn()

const render = () => {
  return renderWithProviders(<RobotCertImportModal onClose={mockOnClose} />, {
    i18nInstance: i18n,
  })
}

describe('RobotCertImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUpdateClientDataEncryptionKeys).mockReturnValue({
      requestKeyDisplay: () => 'request-key',
      clearKeyDisplay: mockClearKeyDisplay,
    } as any as ReturnType<typeof useUpdateClientDataEncryptionKeys>)
    vi.mocked(useHandleRobotCertImport).mockReturnValue({
      passwordError: null,
      setPasswordValue: mockSetPasswordValue,
      passwordValue: '',
      importInProgress: false,
      tryImport: mockTryImport,
    })
  })

  it('should render title, description, input, cancel, and submit', () => {
    render()
    screen.getByText('Enter robot encryption key')
    screen.getByText(
      'The encryption key can be found under settings on the on-device touchscreen.'
    )
    screen.getByLabelText('Robot encryption key')
    screen.getByRole('button', { name: 'Cancel' })
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })

  it('should call onClose when Cancel is clicked', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockClearKeyDisplay).toHaveBeenCalledWith('request-key')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should enable Submit and try import when a key is entered', () => {
    vi.mocked(useHandleRobotCertImport).mockReturnValue({
      passwordError: null,
      setPasswordValue: mockSetPasswordValue,
      passwordValue: 'secret-key',
      importInProgress: false,
      tryImport: mockTryImport,
    })
    render()
    const submit = screen.getByRole('button', { name: 'Submit' })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(mockTryImport).toHaveBeenCalled()
  })
})
