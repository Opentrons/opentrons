import { StyledText } from '@opentrons/components'

import { LabwareButton } from '../../atoms'

import type { Dispatch, SetStateAction } from 'react'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

interface LabwareButtonContainerProps {
  stackOfLabware: string[]
  labware: AllTemporalPropertiesForTimelineFrame['labware']
  setSelectedLabware: Dispatch<SetStateAction<string>>
  selectedLabware: string
}
export function LabwareButtonContainer(
  props: LabwareButtonContainerProps
): JSX.Element {
  const { stackOfLabware, labware, selectedLabware, setSelectedLabware } = props

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <StyledText desktopStyle="captionRegular">Top of stack</StyledText>
      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        {stackOfLabware.map((item, index) => (
          <LabwareButton
            key={`${item}_${index}`}
            numberInStack={index + 1}
            displayName={labware[item].def.metadata.displayName}
            isSelected={selectedLabware === item}
            onClick={id => {
              setSelectedLabware(id)
            }}
            id={item}
          />
        ))}
      </div>
      <StyledText desktopStyle="captionRegular">Bottom of Stack</StyledText>
    </div>
  )
}
