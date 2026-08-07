import { action } from 'storybook/actions'

import { TopPortalRoot } from '/app/App/portal'
import { i18n } from '/app/i18n'

import { UserAccountConfirmModal } from './UserAccountConfirmModal'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof UserAccountConfirmModal> = {
  title: 'App/Organisms/UserAccountConfirmModal',
  component: UserAccountConfirmModal,
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

type Story = StoryObj<typeof UserAccountConfirmModal>

const defaultHandlers = {
  onConfirm: action('onConfirm'),
  onCancel: action('onCancel'),
}

export const DeleteUser: Story = {
  args: {
    title: i18n.t('desktop_delete_user_modal_title', {
      ns: 'device_settings',
    }),
    heading: i18n.t('desktop_delete_user_modal_heading', {
      ns: 'device_settings',
    }),
    description: i18n.t('desktop_delete_user_modal_description', {
      ns: 'device_settings',
    }),
    confirmLabel: i18n.t('delete', { ns: 'shared' }),
    ...defaultHandlers,
  },
}

export const LockAccount: Story = {
  args: {
    title: i18n.t('desktop_lock_user_modal_title', { ns: 'device_settings' }),
    heading: i18n.t('desktop_lock_user_modal_heading', {
      ns: 'device_settings',
    }),
    description: i18n.t('desktop_lock_user_modal_description', {
      ns: 'device_settings',
    }),
    confirmLabel: i18n.t('desktop_lock_user', { ns: 'device_settings' }),
    ...defaultHandlers,
  },
}

export const ActivateAccount: Story = {
  args: {
    title: i18n.t('desktop_activate_user_modal_title', {
      ns: 'device_settings',
    }),
    heading: i18n.t('desktop_activate_user_modal_heading', {
      ns: 'device_settings',
    }),
    description: i18n.t('desktop_activate_user_modal_description', {
      ns: 'device_settings',
    }),
    confirmLabel: i18n.t('desktop_unlock_user', { ns: 'device_settings' }),
    ...defaultHandlers,
  },
}

export const ResetPassword: Story = {
  args: {
    title: i18n.t('desktop_reset_password', { ns: 'device_settings' }),
    heading: i18n.t('desktop_reset_password_modal_heading', {
      ns: 'device_settings',
    }),
    description: i18n.t('desktop_reset_password_modal_description', {
      ns: 'device_settings',
    }),
    confirmLabel: i18n.t('desktop_reset_password', { ns: 'device_settings' }),
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
