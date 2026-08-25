import { memo } from 'react'

import { COLORS } from '../../../../helix-design-system'
import { Well } from './Well'

import type { CSSProperties, MemoExoticComponent, ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { WellGroup } from './constants'

type WellContents =
  | 'tipPresent'
  | 'tipMissing'
  | 'defaultWell'
  | 'disabledWell'
  | 'highlightedWell'
  | 'selectedWell'
export interface StyledWellProps {
  wellContents: WellContents
  definition: LabwareDefinition
  wells: WellGroup
}

export const STYLE_BY_WELL_CONTENTS: {
  [wellContents in WellContents]: {
    stroke: CSSProperties['stroke']
    fill: CSSProperties['fill']
    strokeWidth: CSSProperties['strokeWidth']
  }
} = {
  highlightedWell: {
    stroke: COLORS.blue50,
    fill: COLORS.transparent,
    strokeWidth: 1,
  },
  disabledWell: {
    stroke: '#C6C6C6', // LEGACY --light-grey-hover
    fill: COLORS.transparent,
    strokeWidth: 0.6,
  },
  selectedWell: {
    stroke: COLORS.blue50,
    fill: COLORS.transparent,
    strokeWidth: 0.5,
  },
  tipMissing: {
    stroke: '#A4A4A4', // LEGACY --c-near-black
    fill: '#E5E2E2', // LEGACY --c-light-gray
    strokeWidth: 0.6,
  },
  tipPresent: {
    fill: COLORS.white,
    stroke: '#A4A4A4', // LEGACY --c-near-black
    strokeWidth: 0.6,
  },
  defaultWell: {
    fill: COLORS.white,
    stroke: COLORS.black90,
    strokeWidth: 0.6,
  },
}

function StyledWellsComponent(props: StyledWellProps): ReactNode {
  const { definition, wells, wellContents } = props
  return (
    <>
      {Object.keys(wells).map((wellName: string) => (
        <Well
          key={wellName}
          wellName={wellName}
          well={definition.wells[wellName]}
          {...STYLE_BY_WELL_CONTENTS[wellContents]}
        />
      ))}
    </>
  )
}

export const StyledWells: MemoExoticComponent<typeof StyledWellsComponent> =
  memo(StyledWellsComponent)
