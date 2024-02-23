import * as React from 'react'
import styled from 'styled-components'
import { TYPOGRAPHY, SPACING, BORDERS, COLORS } from '@opentrons/components'
import { createSnippet } from './createSnippet'
import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type {
  LoadedLabware,
  LoadedModule,
  RunTimeCommand,
} from '@opentrons/shared-data'

const JsonTextArea = styled.textarea`
  min-height: 28vh;
  width: 100%;
  background-color: ${COLORS.grey30};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing8};
  margin: ${SPACING.spacing16} 0;
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  font-family: monospace;
  resize: none;
`
interface PythonLabwareOffsetSnippetProps {
  mode: 'jupyter' | 'cli'
  commands: RunTimeCommand[]
  labware: LoadedLabware[]
  modules: LoadedModule[]
  labwareOffsets: LabwareOffsetCreateData[] | null
}

export function PythonLabwareOffsetSnippet(
  props: PythonLabwareOffsetSnippetProps
): JSX.Element | null {
  const { commands, labware, modules, labwareOffsets, mode } = props
  const [snippet, setSnippet] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (labware.length > 0 && labwareOffsets != null) {
      setSnippet(
        createSnippet(mode, commands, labware, modules, labwareOffsets)
      )
    }
  }, [mode, JSON.stringify(labwareOffsets)])

  return <JsonTextArea readOnly value={snippet ?? ''} spellCheck={false} />
}
