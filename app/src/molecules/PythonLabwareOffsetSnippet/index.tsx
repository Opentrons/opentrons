import * as React from 'react'
import styled from 'styled-components'
import { TYPOGRAPHY, SPACING, BORDERS } from '@opentrons/components'
import { createSnippet } from './createSnippet'
import type { LabwareOffset } from '@opentrons/api-client'
import type {
  LoadedLabware,
  LoadedModule,
  RunTimeCommand,
} from '@opentrons/shared-data'

const JsonTextArea = styled.textarea`
  min-height: 12vh;
  width: 100%;
  background-color: #f8f8f8;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3};
  margin: ${SPACING.spacing4} 0;
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  font-family: monospace;
  resize: none;
`
interface PythonLabwareOffsetSnippetProps {
  mode: 'jupyter' | 'cli'
  commands: RunTimeCommand[],
  labware: LoadedLabware[],
  modules: LoadedModule[],
  labwareOffsets: LabwareOffset[] | null
}

export function PythonLabwareOffsetSnippet(
  props: PythonLabwareOffsetSnippetProps
): JSX.Element | null {
  const { commands, labware, modules, labwareOffsets, mode } = props
  const [snippet, setSnippet] = React.useState<string | null>(null)
console.table(props)
  React.useEffect(() => {
    if (labware.length > 0 && labwareOffsets != null) {
      setSnippet(createSnippet(mode, commands, labware, modules, labwareOffsets))
    }
  }, [mode, JSON.stringify(labwareOffsets)])

  return <JsonTextArea readOnly value={snippet ?? ''} spellCheck={false} />
}
