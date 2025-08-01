import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertModal } from '@opentrons/components'

interface PasswordModalProps {
  onConfirm: (password: string) => void
  onCancel: () => void
}

export function PasswordModal(props: PasswordModalProps): JSX.Element {
  const { onConfirm, onCancel } = props
  const { t } = useTranslation('protocol_list')
  const [password, setPassword] = React.useState('')

  const handleConfirm = (): void => {
    onConfirm(password)
  }

  return (
    <AlertModal
      heading={t('password_required')}
      buttons={[
        { children: t('shared:cancel'), onClick: onCancel },
        {
          children: t('shared:confirm'),
          onClick: handleConfirm,
          disabled: password.length === 0,
        },
      ]}
    >
      <p>{t('enter_password_to_proceed')}</p>
      <input
        type="password"
        value={password}
        onChange={e => { setPassword(e.target.value) }}
        style={{ width: '100%', padding: '0.5rem' }}
      />
    </AlertModal>
  )
}