import * as React from 'react'
import { ALIGN_START, Flex } from '@opentrons/components'
import { LabwarePositionCheckStepDetail } from './LabwarePositionCheckStepDetail'
import { PositionCheckNav } from './PositionCheckNav'
import type { LabwarePositionCheckStep } from './types'
import { useIntroInfo } from './hooks'

interface GenericStepScreenProps {
  selectedStep: LabwarePositionCheckStep
  setCurrentLabwareCheckStep: (stepNumber: number) => void
}
export function GenericStepScreen(
  props: GenericStepScreenProps
): JSX.Element | null {
  const introInfo = useIntroInfo()
  const [sectionIndex] = React.useState<number>(0)
  if (introInfo == null) return null
  const { sections, primaryPipetteMount, secondaryPipetteMount } = introInfo
  return (
    <React.Fragment>
      <Flex alignItems={ALIGN_START}>
        <PositionCheckNav
          primaryPipetteMount={primaryPipetteMount}
          secondaryPipetteMount={secondaryPipetteMount}
          sections={sections}
          currentSection={sections[sectionIndex]}
          completedSections={[sections[sectionIndex - 1]]}
        />
        <Flex>
          <LabwarePositionCheckStepDetail selectedStep={props.selectedStep} />
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
