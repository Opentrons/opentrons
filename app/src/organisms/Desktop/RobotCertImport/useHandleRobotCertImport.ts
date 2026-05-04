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
  passwordError: string | null
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
  const [passwordError, setPasswordError] = useState<string | null>(null)
  useEffect(() => {
    setPasswordError(null)
  }, [passwordValue])
  const host = useHost()

  const tryInstallWith: typeof tryInstallRobotCertificate = async props => {
    try {
      return await tryInstallRobotCertificate(props)
    } catch (err: any) {
      return false
    }
  }

  const { status, mutate } = useMutation<boolean>({
    mutationFn: async () => {
      if (host == null) {
        throw new Error('Robot is not connected')
      }
      const response = await getEncryptedCACertificates(host)
      const currentCert = response?.data?.data.current
      if (currentCert == null) {
        throw new Error('Failed to fetch CA certificates')
      }
      const installedCurrent = await tryInstallWith({
        password: passwordValue,
        certificateData: currentCert.current.cert_data,
        salt: currentCert.current.key_salt,
        iterations: currentCert.current.kdf_iterations,
      })
      const installed =
        installedCurrent ||
        (currentCert.previous != null &&
          (await tryInstallWith({
            password: passwordValue,
            certificateData: currentCert.previous.cert_data,
            salt: currentCert.previous.key_salt,
            iterations: currentCert.previous.kdf_iterations,
          })))
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
