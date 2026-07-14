import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { EnterRobotEncryptionKey } from '..'
import { RobotCertImportModal } from '../RobotCertImportModal'

vi.mock('../RobotCertImportModal')
vi.mock('/app/App/portal', () => ({
  getTopPortalEl: () => globalThis.document.body,
}))

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <EnterRobotEncryptionKey />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings EnterRobotEncryptionKey', () => {
  beforeEach(() => {
    vi.mocked(RobotCertImportModal).mockImplementation(({ onClose }) => (
      <div>
        <span>mock RobotCertImportModal</span>
        <button onClick={onClose}>close modal</button>
      </div>
    ))
  })

  it('should render title, description, and button', () => {
    render()
    screen.getByText('Robot encryption key')
    screen.getByText(
      'Enter the robot encryption key to verify and securely connect to this robot.'
    )
    expect(
      screen.getByRole('button', { name: 'Enter encryption key' })
    ).toBeInTheDocument()
  })

  it('should open the cert import modal when clicking the button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', { name: 'Enter encryption key' })
    )
    screen.getByText('mock RobotCertImportModal')
  })
})
