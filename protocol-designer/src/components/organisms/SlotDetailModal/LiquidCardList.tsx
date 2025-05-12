import { useEffect, useRef } from 'react'
import { css } from 'styled-components'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { LiquidDetailCard } from './LiquidDetailCard'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AllIngredGroupFields } from '../../../labware-ingred/types'

interface LiquidCardListProps {
  selectedLabwareDefinition: LabwareDefinition2
  selectedLiquidId: string | undefined
  setSelectedLiquidId: Dispatch<SetStateAction<string | undefined>>
  allIngredGroupFields: AllIngredGroupFields
  individualIds: string[]
  volumeByWell: { [wellName: string]: number }
}

export const LiquidCardList = (props: LiquidCardListProps): JSX.Element => {
  const {
    selectedLabwareDefinition,
    selectedLiquidId,
    setSelectedLiquidId,
    allIngredGroupFields,
    individualIds,
    volumeByWell,
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
          labwareWellOrdering={selectedLabwareDefinition.ordering}
          setSelectedValue={setSelectedLiquidId}
          selectedValue={selectedLiquidId}
          volumeByWell={volumeByWell}
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
