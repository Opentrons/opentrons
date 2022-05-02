import * as React from 'react'
import { Modal } from '../../atoms/Modal'
import { useOffsetCandidatesForCurrentRun } from './hooks'

export function ReapplyOffsetsModal(): JSX.Element {
  const offsetCandidates = useOffsetCandidatesForCurrentRun()
  return (
    <Modal>
      {offsetCandidates.map(offset => (
        <p>{offset.id}</p>
      ))}
    </Modal>
  )
}
