import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsAdminForRobot } from '/app/redux/robot-auth/hooks'

import { RobotSettingsComplianceReady } from '../index'

import type { RenderResult } from '@testing-library/react'
import type { Store } from 'redux'
import type { State } from '/app/redux/types'
import type { PersonalAccountSettingsProps } from '../PersonalAccountSettings'
import type { UserManagementProps } from '../UserManagement'

vi.mock('/app/redux/robot-auth/hooks')
vi.mock('../PersonalAccountSettings', () => ({
  PersonalAccountSettings: ({
    viewRef,
    isEditing,
    setIsEditing,
    showAdminWarningBanner,
  }: PersonalAccountSettingsProps) => (
    <div ref={viewRef}>
      <span>{`isEditing:${String(isEditing)}`}</span>
      <span>{`showAdminWarningBanner:${String(showAdminWarningBanner)}`}</span>
      <button
        type="button"
        onClick={() => {
          setIsEditing(false)
        }}
      >
        mock stop editing
      </button>
    </div>
  ),
}))
vi.mock('../ComplianceReadySoftwareSettings', () => ({
  ComplianceReadySoftwareSettings: () => (
    <div>mock ComplianceReadySoftwareSettings</div>
  ),
}))
vi.mock('../UserManagement', () => ({
  UserManagement: ({
    onShowOneTimePassword,
    onEditSelf,
  }: UserManagementProps) => (
    <>
      <button
        type="button"
        onClick={() => {
          onShowOneTimePassword('temp-password-abc')
        }}
      >
        mock show otp
      </button>
      <button type="button" onClick={onEditSelf}>
        mock edit self
      </button>
    </>
  ),
}))

const ROBOT_NAME = 'flex-1'

const render = (): [RenderResult, Store<State>] => {
  return renderWithProviders(
    <RobotSettingsComplianceReady robotName={ROBOT_NAME} />,
    {
      i18nInstance: i18n,
      initialState: {
        robotAuth: {
          perRobotAuthStates: {
            [ROBOT_NAME]: {
              user: {
                username: 'alice',
                fullName: 'Alice Example',
                accountType: 'admin' as const,
              },
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
              expiresAt: null,
            },
          },
          mostRecentRobotName: ROBOT_NAME,
        },
      } as unknown as State,
    }
  )
}

describe('RobotSettingsComplianceReady', () => {
  beforeEach(() => {
    vi.mocked(useIsAdminForRobot).mockReturnValue(true)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens personal account settings in edit mode with the admin warning when editing self from user management', () => {
    render()

    screen.getByText('isEditing:false')
    screen.getByText('showAdminWarningBanner:false')

    fireEvent.click(screen.getByRole('button', { name: 'mock edit self' }))

    screen.getByText('isEditing:true')
    screen.getByText('showAdminWarningBanner:true')
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    })

    fireEvent.click(screen.getByRole('button', { name: 'mock stop editing' }))

    screen.getByText('isEditing:false')
    screen.getByText('showAdminWarningBanner:false')
  })

  it('keeps the one-time password visible after admin status is lost and clears it when the modal is exited', () => {
    const [result] = render()

    fireEvent.click(screen.getByRole('button', { name: 'mock show otp' }))
    screen.getByText('temp-password-abc')

    // Password reset revokes tokens; admin UI unmounts, but OTP must remain.
    vi.mocked(useIsAdminForRobot).mockReturnValue(false)
    result.rerender(<RobotSettingsComplianceReady robotName={ROBOT_NAME} />)

    expect(
      screen.queryByRole('button', { name: 'mock show otp' })
    ).not.toBeInTheDocument()
    screen.getByText('temp-password-abc')

    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))

    expect(screen.queryByText('temp-password-abc')).not.toBeInTheDocument()
  })
})
