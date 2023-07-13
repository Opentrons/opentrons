import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

interface DeckSlotProps {
  slotName: DeckSlot['id']
  deckDefinition: DeckDefinition
}

export function DeckSlotLocation(props: DeckSlotProps): JSX.Element | null {
  const { slotName, deckDefinition } = props

  const slotDef = deckDefinition?.locations.orderedSlots.find(s => s.id === slotName)
  const slotLayers = deckDefinition.layers.filter(l => l.attributes.id.includes(slotName))

  if (slotDef == null) {
    console.warn(`cannot render DeckSlotLocation, no deck slot named: ${slotName} in deck def ${deckDefinition?.otId}`)
    return null
  }

  const groupNodeWrapper = {
    name: 'g',
    type: 'element',
    value: '',
    attributes: { id: `slot${slotName}Layers` },
    children: slotLayers,
  }

  return (
    <g transform={`translate(${slotDef.x}, ${slotDef.y})`}>
      {parseHtml( stringify(groupNodeWrapper, { selfClose: false }))}
    </g>
  )
}
