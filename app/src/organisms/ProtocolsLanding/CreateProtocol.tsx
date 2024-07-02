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
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SecondaryButton,
} from '@opentrons/components'
import {
  analyzeCreateProtocol,
  getCodeAnalysis,
} from '../../redux/protocol-storage'
import { ProtocolTimelineScrubber } from '../ProtocolTimelineScrubber'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { Dispatch, State } from '../../redux/types'

export function CreateProtocol(props: { goBack: () => void }): JSX.Element {
  const { goBack } = props
  const [code, setCode] = React.useState('')
  const dispatch = useDispatch<Dispatch>()
  const analysis = useSelector((state: State) => getCodeAnalysis(state))
  const onChange = (newValue: any): void => {
    setCode(newValue)
  }
  const onExecute = (): void => {
    dispatch(analyzeCreateProtocol(code))
  }

  const jsonAnalysis: CompletedProtocolAnalysis =
    analysis != null ? JSON.parse(analysis) : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} margin={SPACING.spacing16}>
        <PrimaryButton onClick={goBack}>Go back</PrimaryButton>
        <LegacyStyledText>Create a python protocol</LegacyStyledText>
        <Flex gridGap={SPACING.spacing4}>
          <SecondaryButton onClick={onExecute}>Execute</SecondaryButton>
          <PrimaryButton
            disabled={jsonAnalysis == null}
            onClick={() => {
              goBack
              console.log(
                'wire this up but should save the protocol and add to the robot list'
              )
            }}
          >
            Save
          </PrimaryButton>
        </Flex>
      </Flex>
      <Flex>
        <Box width="50%">
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
            height="90vh"
          />
        </Box>
        {jsonAnalysis != null && code !== '' ? (
          <Box width="50%" padding={SPACING.spacing16}>
            <ProtocolTimelineScrubber
              isCreateMode
              commands={jsonAnalysis.commands}
              analysis={jsonAnalysis}
              robotType={jsonAnalysis.robotType ?? 'OT-3 Standard'}
            />
          </Box>
        ) : (
          <LegacyStyledText as="p">
            No protocol timeline to display. Create a protocol and press
            "Execute" to see the timeline.
          </LegacyStyledText>
        )}
      </Flex>
    </Flex>
  )
}
