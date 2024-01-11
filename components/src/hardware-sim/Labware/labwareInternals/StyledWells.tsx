import * as React from 'react'
import { Well } from './Well'
import { LEGACY_COLORS } from '../../../ui-style-constants'
import { COLORS } from '../../../helix-design-system'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellGroup } from './types'
import { COLORS } from '../../../ui-style-constants'

type WellContents =
  | 'tipPresent'
  | 'tipMissing'
  | 'defaultWell'
  | 'disabledWell'
  | 'highlightedWell'
  | 'selectedWell'
export interface StyledWellProps {
  wellContents: WellContents
  definition: LabwareDefinition2
  wells: WellGroup
}

export const STYLE_BY_WELL_CONTENTS: {
  [wellContents in WellContents]: {
    stroke: React.CSSProperties['stroke']
    fill: React.CSSProperties['fill']
    strokeWidth: React.CSSProperties['strokeWidth']
  }
} = {
  highlightedWell: {
    stroke: COLORS.blue50,
    fill: `${COLORS.blue50}33`, // 20% opacity
    strokeWidth: 1,
  },
  disabledWell: {
    stroke: '#C6C6C6', // LEGACY --light-grey-hover
    fill: '#EDEDEDCC', // LEGACY --lightest-gray + 80% opacity
    strokeWidth: 0.6,
  },
  selectedWell: {
    stroke: COLORS.blue50,
    fill: COLORS.transparent,
    strokeWidth: 1,
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
    stroke: COLORS.black,
    strokeWidth: 0.6,
  },
}

function StyledWellsComponent(props: StyledWellProps): JSX.Element {
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

export const StyledWells: React.MemoExoticComponent<
  typeof StyledWellsComponent
> = React.memo(StyledWellsComponent)
