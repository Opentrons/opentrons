// @flow
import * as React from 'react'
import {
  WellLabels,
  StyledWells,
  FilledWells,
  StaticLabware,
} from './labwareInternals'
import styles from './labwareRender.css'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type LabwareRenderProps = {|
  definition: LabwareDefinition2,
  showLabels?: boolean,
  missingTips?: Set<string>,
  highlightedWells?: Set<string>,
  /** CSS color to fill specified wells */
  wellFill?: { [wellName: string]: string },
  /** Optional callback, called with well name onMouseOver */
  onMouseOverWell?: (wellName: string) => mixed,
  /** Special class which, together with 'data-wellname' on the well elements,
    allows drag-to-select behavior */
  selectableWellClass?: string,
|}

export default function LabwareRender(props: LabwareRenderProps) {
  return (
    <g>
      <StaticLabware
        definition={props.definition}
        onMouseOverWell={props.onMouseOverWell}
        selectableWellClass={props.selectableWellClass}
      />
      {props.wellFill && (
        <FilledWells
          definition={props.definition}
          fillByWell={props.wellFill}
        />
      )}
      {props.highlightedWells && (
        <StyledWells
          noInnerTipCircle
          className={styles.highlighted_well}
          definition={props.definition}
          wells={props.highlightedWells}
        />
      )}
      {props.missingTips && (
        <StyledWells
          noInnerTipCircle
          className={styles.missing_tip}
          definition={props.definition}
          wells={props.missingTips}
        />
      )}
      {props.showLabels && <WellLabels definition={props.definition} />}
    </g>
  )
}
