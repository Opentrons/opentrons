import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'

import {
  getEncryptedCACertificates,
  getPlaintextCACertificates,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { tryInstallRobotCertificate } from '/app/redux/shell/remote'

export interface UseHandleRobotCertImportProps {
  onSuccessfulImport: () => unknown
}

export interface UseHandleRobotCertImportResult {
  passwordError: string | undefined
  setPasswordValue: (password: string) => unknown
  passwordValue: string
  importInProgress: boolean
  tryImport: () => unknown
}
export function useHandleRobotCertImport(
  props: UseHandleRobotCertImportProps
): UseHandleRobotCertImportResult {
  const { t } = useTranslation('device_settings')
  const [passwordValue, setPasswordValue] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined
  )
  useEffect(() => {
    setPasswordError(undefined)
  }, [passwordValue])
  const host = useHost()

  const { status, mutate } = useMutation<boolean>({
    mutationFn: async () => {
      const response = await getEncryptedCACertificates(host!)
      const currentCert = response?.data?.data.current
      if (currentCert == null) {
        throw new Error('Failed to fetch CA certificates')
      }
      let installed = false
      try {
        installed = await tryInstallRobotCertificate({
          password: passwordValue,
          certificateData: currentCert.current.cert_data,
          salt: currentCert.current.key_salt,
          iterations: currentCert.current.kdf_iterations,
        })
      } catch (err: any) {
        installed = false
      }
      if (!installed && currentCert.previous != null) {
        installed = await tryInstallRobotCertificate({
          password: passwordValue,
          certificateData: currentCert.previous.cert_data,
          salt: currentCert.previous.key_salt,
          iterations: currentCert.previous.kdf_iterations,
        })
      }
      if (!installed) {
        throw new Error('Certificate install failed, probably bad password')
      }

      const plaintext = await getPlaintextCACertificates(host!)
      if (plaintext.status === 200) {
        return true
      } else {
        throw new Error(
          `Could not fetch CA certificates: ${plaintext.status} ${plaintext.statusText}`
        )
      }
    },
    mutationKey: [host!, 'encrypted_ca_certs'],
    onError: (err: any) => {
      setPasswordError((err as Error)?.message ?? t('invalid_password'))
    },
    onSuccess: () => {
      props.onSuccessfulImport()
    },
  })
  return {
    passwordError,
    setPasswordValue,
    passwordValue,
    importInProgress: status === 'loading',
    tryImport: () => {
      mutate()
    },
  }
}
