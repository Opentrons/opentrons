import * as React from 'react'
import styled from 'styled-components'
import { FONT_SIZE_CAPTION, SPACING_2 } from '@opentrons/components'
import { createSnippet } from './createSnippet'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

const JsonTextArea = styled.textarea`
  min-height: 30vh;
  width: 100%;
  padding: ${SPACING_2};
  font-size: ${FONT_SIZE_CAPTION};
  font-family: monospace;
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

  if (protocol == null || labwareOffsets == null || snippet == null) return null

  return <JsonTextArea readOnly value={snippet} spellCheck={false} />
}
