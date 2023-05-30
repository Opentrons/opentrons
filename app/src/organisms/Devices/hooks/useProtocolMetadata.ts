import { useCurrentProtocol } from '../../ProtocolUpload/hooks'

interface ProtocolMetadata {
  author?: string
  lastUpdated?: number | null
  description?: string | null
  creationMethod?: 'json' | 'python'
  [key: string]: any
}

export function useProtocolMetadata(): ProtocolMetadata {
  const protocolRecord = useCurrentProtocol()
  const protocolMetadata = protocolRecord?.data?.metadata
  const creationMethod = protocolRecord?.data?.protocolType
  const author = protocolMetadata?.author
  const description = protocolMetadata?.description
  const lastUpdated = protocolMetadata?.lastModified

  return {
    ...protocolMetadata,
    author,
    lastUpdated,
    description,
    creationMethod,
  }
}
