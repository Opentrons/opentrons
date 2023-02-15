import * as React from 'react'
import styled from 'styled-components'
import { TYPOGRAPHY, SPACING, BORDERS } from '@opentrons/components'
import { createSnippet } from './createSnippet'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

const JsonTextArea = styled.textarea`
  min-height: 12vh;
  width: 100%;
  background-color: #F8F8F8;
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
  protocol: LegacySchemaAdapterOutput | null
  labwareOffsets: LabwareOffset[] | null
}

export function PythonLabwareOffsetSnippet(
  props: PythonLabwareOffsetSnippetProps
): JSX.Element | null {
  const { protocol, labwareOffsets, mode } = props
  const [snippet, setSnippet] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (protocol != null && labwareOffsets != null) {
      setSnippet(createSnippet(mode, protocol, labwareOffsets))
    }
  }, [mode, JSON.stringify(labwareOffsets)])

  return <JsonTextArea readOnly value={snippet ?? ''} spellCheck={false} />
}
