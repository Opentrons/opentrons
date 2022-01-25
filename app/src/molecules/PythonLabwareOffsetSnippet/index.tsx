import * as React from 'react'
import styled from 'styled-components'
import {
  FONT_SIZE_CAPTION,
  SPACING_2,
  NewPrimaryBtn,
  Icon,
  SIZE_3,
  C_WHITE,
} from '@opentrons/components'
import { createSnippet } from './createSnippet'
import type { ProtocolFile } from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'

const JsonTextArea = styled.textarea`
  min-height: 30vh;
  width: 100%;
  padding: ${SPACING_2};
  font-size: ${FONT_SIZE_CAPTION};
  font-family: monospace;
`
interface PythonLabwareOffsetSnippetProps {
  mode: 'jupyter' | 'cli'
  protocol: ProtocolFile<{}> | null
  run: RunData | null
}

export function PythonLabwareOffsetSnippet(
  props: PythonLabwareOffsetSnippetProps
): JSX.Element | null {
  const { protocol, run, mode } = props

  if (protocol == null || run == null) return null
  const snippet = createSnippet(mode, protocol, run.labwareOffsets)
  if (snippet == null) return null

  return (
    <JsonTextArea readOnly value={snippet} spellCheck={false} />
  )
}
