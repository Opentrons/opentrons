import { useSelector } from 'react-redux'

import { selectSortedLSOffsetDetailsWithCopy } from '/app/redux/protocol-runs'

import { AccordionDetail } from './AccordionDetail'

import type { ReactNode } from 'react'
import type { LPCLabwareInfoAndDefaultStatus } from '/app/redux/protocol-runs'
import type { LabwareOffsetsTableProps } from '.'

export interface AccordionChildrenProps extends LabwareOffsetsTableProps {
  lpcLabwareInfo: LPCLabwareInfoAndDefaultStatus
}

export function AccordionChildren(props: AccordionChildrenProps): ReactNode {
  const { runId, lpcLabwareInfo } = props

  const sortedLSDetailsWithCopy = useSelector(
    selectSortedLSOffsetDetailsWithCopy(runId, lpcLabwareInfo.uri)
  )

  return (
    <>
      {sortedLSDetailsWithCopy.map(lsDetail => (
        <AccordionDetail
          key={`${lsDetail.locationDetails.addressableAreaName}${lsDetail.locationDetails.closestBeneathModuleId}${lsDetail.locationDetails.closestBeneathAdapterId}`}
          {...props}
          detail={lsDetail}
        />
      ))}
    </>
  )
}
