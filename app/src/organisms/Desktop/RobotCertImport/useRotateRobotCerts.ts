import { useQuery } from 'react-query'

import { getPlaintextCACertificates } from '@opentrons/api-client'
import { getQueryKey, useHost } from '@opentrons/react-api-client'

import { tryInstallPlaintextRobotCertificate } from '/app/redux/shell/remote'

import type { UseQueryResult } from 'react-query'
import type { UnencryptedCert } from '@opentrons/api-client'

async function getNextCACert(
  host: ReturnType<typeof useHost>
): Promise<UnencryptedCert | null> {
  if (host == null) {
    return null
  }
  try {
    const queryResult = await getPlaintextCACertificates(host)
    return queryResult?.data?.data?.next ?? null
  } catch (err: any) {
    // this could be anything but most likely is an SSL error;
    // if this fails it's fine, it just means we won't rotate the
    // certs and react-query will retry eventually
    return null
  }
}

export function useRotateRobotCerts(): UseQueryResult<boolean> {
  const host = useHost()
  return useQuery<boolean>({
    queryFn: async () => {
      if (host == null) {
        return false
      }
      const maybeCert = await getNextCACert(host)
      if (maybeCert == null) {
        return false
      }

      return await tryInstallPlaintextRobotCertificate({
        certificateData: maybeCert.cert_data,
      })
    },
    queryKey: getQueryKey(host, 'rotate-robot-certs'),
    refetchInterval: 24 * 60 * 60 * 1000,
    staleTime: 24 * 60 * 60 * 1000,
    enabled: host != null,
  })
}
