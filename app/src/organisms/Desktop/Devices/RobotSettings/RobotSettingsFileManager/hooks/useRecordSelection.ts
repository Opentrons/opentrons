import { useEffect, useState } from 'react'

interface Selectable {
  id: string
}

interface UseRecordSelectionResult {
  selectedIds: Set<string>
  isAllSelected: boolean
  isSomeSelected: boolean
  toggleAll: () => void
  toggleOne: (id: string) => void
}

export function useRecordSelection<T extends Selectable>(
  records: T[]
): UseRecordSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drop ids that no longer correspond to a record (e.g. once stubbed data
  // is replaced by a real query response) so selection state never points
  // at a record that has disappeared out from under it.
  useEffect(() => {
    setSelectedIds(prev => {
      const validIds = new Set(records.map(r => r.id))
      const next = new Set([...prev].filter(id => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [records])

  const isAllSelected =
    records.length > 0 && records.every(r => selectedIds.has(r.id))
  const isSomeSelected =
    !isAllSelected && records.some(r => selectedIds.has(r.id))

  const toggleAll = (): void => {
    if (isAllSelected || isSomeSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map(r => r.id)))
    }
  }

  const toggleOne = (id: string): void => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return { selectedIds, isAllSelected, isSomeSelected, toggleAll, toggleOne }
}
