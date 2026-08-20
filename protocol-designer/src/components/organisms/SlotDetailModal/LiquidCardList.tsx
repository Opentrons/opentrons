import { useEffect, useRef } from 'react'
import { css } from 'styled-components'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { LiquidDetailCard } from './LiquidDetailCard'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { AllIngredGroupFields } from '/protocol-designer/labware-ingred/types'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'
import type { WellContentsByNumber } from './index'

interface LiquidCardListProps {
  selectedLabware: LabwareOnDeck
  selectedLiquidId: string
  setSelectedLiquidId: Dispatch<SetStateAction<string | undefined>>
  allIngredGroupFields: AllIngredGroupFields
  individualIds: string[]
  volumesPerLiquid: Record<string, WellContentsByNumber>
}

export const LiquidCardList = (props: LiquidCardListProps): ReactNode => {
  const {
    selectedLabware,
    selectedLiquidId,
    setSelectedLiquidId,
    allIngredGroupFields,
    individualIds,
    volumesPerLiquid,
  } = props
  const currentLiquidRef = useRef<HTMLDivElement>(null)

  const scrollToCurrentItem = (): void => {
    currentLiquidRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToCurrentItem()
  }, [])
  const liquidCardList = individualIds.map(id => {
    const liquidInfo = allIngredGroupFields[id]
    return (
      <Flex
        key={id}
        ref={selectedLiquidId === id ? currentLiquidRef : undefined}
      >
        <LiquidDetailCard
          liquidInfo={liquidInfo}
          liquidId={id}
          labwareWellOrdering={selectedLabware.def.ordering}
          setSelectedValue={setSelectedLiquidId}
          selectedValue={selectedLiquidId}
          volumesPerLiquid={volumesPerLiquid}
        />
      </Flex>
    )
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="26rem"
      overflowY="auto"
      css={HIDE_SCROLLBAR}
      minWidth="10.313rem"
      gridGap={SPACING.spacing8}
    >
      {liquidCardList}
    </Flex>
  )
}

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`
