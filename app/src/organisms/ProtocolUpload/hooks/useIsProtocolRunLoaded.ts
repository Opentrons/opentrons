import { useCurrentProtocol } from './useCurrentProtocol'
import { useCurrentRun } from './useCurrentRun'

export function useIsProtocolRunLoaded(): boolean {
  const protocolRecord = useCurrentProtocol()
  const runRecord = useCurrentRun()

  const analysisNotOk =
    protocolRecord?.data?.analyses[0] != null &&
    'result' in protocolRecord.data.analyses[0] &&
    protocolRecord.data.analyses[0].result === 'not-ok'

  return runRecord != null && protocolRecord != null && !analysisNotOk
}
