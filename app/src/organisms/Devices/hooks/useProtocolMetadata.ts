import { useCurrentProtocol } from '../../ProtocolUpload/hooks'
import type { RobotType } from '@opentrons/shared-data'
interface ProtocolMetadata {
  author?: string
  lastUpdated?: number | null
  description?: string | null
  creationMethod?: 'json' | 'python'
  robotType?: RobotType
  [key: string]: any
}

export function useProtocolMetadata(): ProtocolMetadata {
  const protocolRecord = useCurrentProtocol()
  const protocolMetadata = protocolRecord?.data?.metadata
  const creationMethod = protocolRecord?.data?.protocolType
  const author = protocolMetadata?.author
  const description = protocolMetadata?.description
  const lastUpdated = protocolMetadata?.lastModified
  // TODO: remove robot type from this hook to align on server definition of metadata
  // see https://github.com/Opentrons/opentrons/pull/12815#discussion_r1210780976
  const robotType = protocolRecord?.data.robotType

  return {
    ...protocolMetadata,
    author,
    lastUpdated,
    description,
    creationMethod,
    robotType,
  }
}
