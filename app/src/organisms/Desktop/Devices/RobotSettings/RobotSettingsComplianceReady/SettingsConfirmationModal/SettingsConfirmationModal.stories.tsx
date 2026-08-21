import { action } from 'storybook/actions'

import { TopPortalRoot } from '/app/App/portal'

import { SettingsConfirmationModal } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SettingsConfirmationModal> = {
  title: 'App/Organisms/SettingsConfirmationModal',
  component: SettingsConfirmationModal,
  decorators: [
    Story => (
      <>
        <TopPortalRoot />
        <Story />
      </>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof SettingsConfirmationModal>

const defaultHandlers = {
  onConfirm: action('onConfirm'),
  onCancel: action('onCancel'),
}

export const DeleteUser: Story = {
  args: {
    title: 'Delete account',
    heading: 'Delete this account?',
    description:
      "The account will be deleted from the robot. Audit logs that contain this user's actions will remain the same after the account has been deleted.",
    confirmLabel: 'Delete',
    ...defaultHandlers,
  },
}

export const LockAccount: Story = {
  args: {
    title: 'Lock account',
    heading: 'Lock this account?',
    description:
      'The user will not be able to log in until an admin unlocks the account and resets the password.',
    confirmLabel: 'Lock account',
    ...defaultHandlers,
  },
}

export const ActivateAccount: Story = {
  args: {
    title: 'Activate account',
    heading: 'Activate this account?',
    description:
      'When you unlock an account and reset the password, users will be able to create a new password the next time they log in.',
    confirmLabel: 'Unlock account and reset password',
    ...defaultHandlers,
  },
}

export const ResetPassword: Story = {
  args: {
    title: 'Reset password',
    heading: "Reset this user's password?",
    description:
      'Once the password is reset, the user will be prompted to create a new password the next time they log in.',
    confirmLabel: 'Reset password',
    ...defaultHandlers,
  },
}

export const RequirePasswordComplexity: Story = {
  args: {
    title: 'Require password complexity?',
    heading: 'Users will need to reset their passwords',
    description:
      'Updating this setting will sign out all users and require them to reset their passwords the next time they sign in.',
    confirmLabel: 'Require password complexity',
    ...defaultHandlers,
  },
}

export const ConfirmDisabled: Story = {
  args: {
    ...ResetPassword.args,
    isConfirmDisabled: true,
    ...defaultHandlers,
  },
}
