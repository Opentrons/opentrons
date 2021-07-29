import { useSelector } from 'react-redux'

import {
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
} from '../../redux/protocol'

interface ProtocolMetadata {
  author: string | null
  lastUpdated: number | null
  method: string | null
  description: string | null
}

export function useProtocolMetadata(): ProtocolMetadata {
  const author = useSelector((state: State) => getProtocolAuthor(state))
  const lastUpdated = useSelector((state: State) =>
    getProtocolLastUpdated(state)
  )
  const method = useSelector((state: State) => getProtocolMethod(state))
  const description = useSelector((state: State) =>
    getProtocolDescription(state)
  )
  return { author, lastUpdated, method, description }
}
