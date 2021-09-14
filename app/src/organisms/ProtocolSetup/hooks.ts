import { useSelector } from 'react-redux'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

import {
  getProtocolAuthor,
  getProtocolLastUpdated,
  getProtocolMethod,
  getProtocolDescription,
  getProtocolData,
} from '../../redux/protocol'

import { getModuleRenderInfo } from './utils/getModuleRenderInfo'
import { getLabwareRenderInfo } from './utils/getLabwareRenderInfo'

import type { ModuleRenderInfoById } from './utils/getModuleRenderInfo'
import type { LabwareRenderInfoById } from './utils/getLabwareRenderInfo'
import type { State } from '../../redux/types'
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

export function useModuleRenderInfoById(): ModuleRenderInfoById {
  const protocolData = useSelector((state: State) => getProtocolData(state))
  return getModuleRenderInfo(protocolData, standardDeckDef as any)
}

export function useLabwareRenderInfoById(): LabwareRenderInfoById {
  const protocolData = useSelector((state: State) => getProtocolData(state))
  return getLabwareRenderInfo(protocolData, standardDeckDef as any)
}
