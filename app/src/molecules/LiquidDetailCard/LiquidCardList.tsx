import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { getIsOnDevice } from '/app/redux/config'

import { LiquidDetailCard } from './LiquidDetailCard'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  LabwareByLiquidId,
  LabwareDefinition,
  ParsedLiquid,
} from '@opentrons/shared-data'

interface LiquidCardListProps {
  selectedLabwareDefinition: LabwareDefinition
  selectedLiquidId: string | undefined
  setSelectedLiquidId: Dispatch<SetStateAction<string | undefined>>
  liquidsInLoadOrder: ParsedLiquid[]
  liquidsByIdForLabware: LabwareByLiquidId
}

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

export const LiquidCardList = (props: LiquidCardListProps): ReactNode => {
  const {
    selectedLabwareDefinition,
    selectedLiquidId,
    setSelectedLiquidId,
    liquidsInLoadOrder,
    liquidsByIdForLabware,
  } = props
  const currentLiquidRef = useRef<HTMLDivElement>(null)
  const isOnDevice = useSelector(getIsOnDevice)

  const scrollToCurrentItem = (): void => {
    currentLiquidRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToCurrentItem()
  }, [])
  const liquidCardList = liquidsInLoadOrder.map(liquid => {
    const labwareInfoEntry = Object.entries(liquidsByIdForLabware).find(
      entry => entry[0] === liquid.id
    )
    return (
      labwareInfoEntry != null && (
        <Flex
          key={liquid.id}
          ref={selectedLiquidId === liquid.id ? currentLiquidRef : undefined}
        >
          <LiquidDetailCard
            {...liquid}
            liquidId={liquid.id}
            volumeByWell={labwareInfoEntry[1][0].volumeByWell}
            labwareWellOrdering={selectedLabwareDefinition.ordering}
            setSelectedValue={setSelectedLiquidId}
            selectedValue={selectedLiquidId}
          />
        </Flex>
      )
    )
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height={isOnDevice ? '23.70375rem' : '26rem'}
      overflowY="auto"
      css={HIDE_SCROLLBAR}
      minWidth="10.313rem"
      gridGap={SPACING.spacing8}
    >
      {liquidCardList}
    </Flex>
  )
}
