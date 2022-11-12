import { useState } from 'react'
import { StoredProtocolData } from '../../redux/protocol-storage'
import { getProtocolDisplayName } from './utils'

export type ProtocolSort = 'alphabetical' | 'reverse' | 'recent' | 'oldest'

export function useSortedProtocols(
  sortBy: ProtocolSort,
  protocolData: StoredProtocolData[]
): StoredProtocolData[] {
  protocolData.sort((a, b) => {
    const protocolNameA = getProtocolDisplayName(
      a.protocolKey,
      a.srcFileNames,
      a?.mostRecentAnalysis
    )
    const protocolNameB = getProtocolDisplayName(
      b.protocolKey,
      b.srcFileNames,
      b?.mostRecentAnalysis
    )

    if (sortBy === 'alphabetical') {
      if (protocolNameA.toLowerCase() === protocolNameB.toLowerCase()) {
        return b.modified - a.modified
      }
      return protocolNameA.toLowerCase() > protocolNameB.toLowerCase() ? 1 : -1
    } else if (sortBy === 'reverse') {
      return protocolNameA.toLowerCase() > protocolNameB.toLowerCase() ? -1 : 1
    } else if (sortBy === 'recent') {
      return b.modified - a.modified
    } else if (sortBy === 'oldest') {
      return a.modified - b.modified
    }
    return 0
  })
  return protocolData
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item != null ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.log(error)
    }
  }
  return [storedValue, setValue]
}
