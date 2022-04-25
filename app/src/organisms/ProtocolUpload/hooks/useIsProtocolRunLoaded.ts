import { useCurrentProtocol } from './useCurrentProtocol'
import { useCurrentRun } from './useCurrentRun'

/*
 * @deprecated slated for removal with 5.1
 */
export function useIsProtocolRunLoaded(): boolean {
  const protocolRecord = useCurrentProtocol()
  const isRunPresent = useCurrentRun() != null

  return isRunPresent && protocolRecord != null
}
