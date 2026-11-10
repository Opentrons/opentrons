import { AlignToModuleChildSlot } from '@opentrons/components'

import { LabwareOnDeck as LabwareOnDeckComponent } from '../../../components/organisms'

import type { ComponentProps, ReactNode } from 'react'
import type { ModuleDefinition } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

type LabwareOnDeckInteractionProps = Omit<
  ComponentProps<typeof LabwareOnDeckComponent>,
  'labwareOnDeck' | 'x' | 'y' | 'centerInSlot'
>

interface ModuleChildLabwareProps extends LabwareOnDeckInteractionProps {
  labwareOnDeck: LabwareOnDeck
  moduleDefinition: ModuleDefinition
  deckId: string
  slotId: string | null
  /** Extra X for special modules (e.g. stacker hopper). */
  xOffset?: number
}

/**
 * Labware on a module.
 * Aligns to the module child slot; LabwareOnDeck centers (default).
 */
export function ModuleChildLabware(props: ModuleChildLabwareProps): ReactNode {
  const {
    labwareOnDeck,
    moduleDefinition,
    deckId,
    slotId,
    xOffset,
    ...labwareOnDeckProps
  } = props

  return (
    <AlignToModuleChildSlot
      deckId={deckId}
      slotId={slotId}
      moduleDefinition={moduleDefinition}
    >
      <LabwareOnDeckComponent
        labwareOnDeck={labwareOnDeck}
        x={xOffset ?? 0}
        y={0}
        {...labwareOnDeckProps}
      />
    </AlignToModuleChildSlot>
  )
}
