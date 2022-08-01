import { useContext, createContext } from 'react'
import { useCurrentProtocol } from '../ProtocolUpload/hooks'

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

// this context is used to trigger an LPC success toast render from an LPC component lower in the tree
export const LPCSuccessToastContext = createContext<{
  setIsShowingLPCSuccessToast: (isShowing: boolean) => void
}>({ setIsShowingLPCSuccessToast: () => null })

export function useLPCSuccessToast(): {
  setIsShowingLPCSuccessToast: (isShowing: boolean) => void
} {
  const { setIsShowingLPCSuccessToast } = useContext(LPCSuccessToastContext)
  return { setIsShowingLPCSuccessToast }
}
