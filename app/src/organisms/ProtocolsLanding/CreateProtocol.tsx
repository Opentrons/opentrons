import * as React from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/theme-github_light_default'
import { useDispatch, useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  PrimaryButton,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  analyzeCreateProtocol,
  getCodeAnalysis,
} from '../../redux/protocol-storage'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { State } from '../../redux/types'

export function CreateProtocol(props: { goBack: () => void }): JSX.Element {
  const { goBack } = props
  const [code, setCode] = React.useState('')
  const dispatch = useDispatch()
  const analysis = useSelector((state: State) => getCodeAnalysis(state))
  const onChange = (newValue: any): void => {
    setCode(newValue)
  }
  const onExecute = (): void => {
    dispatch(analyzeCreateProtocol(code))
  }

  const stringifiedAnalysis: CompletedProtocolAnalysis =
    analysis != null ? JSON.parse(analysis) : null
  console.log('stringifiedAnalysis', stringifiedAnalysis)
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {analysis != null ? analysis : null}

      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} margin="1rem">
        <PrimaryButton onClick={goBack}>Go back</PrimaryButton>
        <LegacyStyledText>Create a python protocol</LegacyStyledText>
        <PrimaryButton onClick={onExecute}>Execute</PrimaryButton>
      </Flex>
      <AceEditor
        mode="python"
        theme="github"
        name="python_editor"
        value={code}
        onChange={onChange}
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
        }}
        width="100%"
        height="500px"
      />
    </Flex>
  )
}
