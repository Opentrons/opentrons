import * as React from 'react'
import AceEditor from 'react-ace'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/theme-github_light_default'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  PrimaryButton,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SecondaryButton,
  ALIGN_CENTER,
  COLORS,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  analyzeCreateProtocol,
  getCodeAnalysis,
} from '../../redux/protocol-storage'
import { ProtocolTimelineScrubber } from '../ProtocolTimelineScrubber'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { Dispatch, State } from '../../redux/types'

export function CreateProtocol(props: { goBack: () => void }): JSX.Element {
  const { goBack } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const { analysis, code: savedCode, error } = useSelector((state: State) =>
    getCodeAnalysis(state)
  )
  const [code, setCode] = React.useState<string>(savedCode ?? '')

  const onChange = (newValue: any): void => {
    setCode(newValue)
  }
  const onExecute = (): void => {
    if (code != null) {
      dispatch(analyzeCreateProtocol(code))
    }
  }

  const jsonAnalysis: CompletedProtocolAnalysis =
    analysis != null ? JSON.parse(analysis) : null

  let display = (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      textAlign={ALIGN_CENTER}
      padding={SPACING.spacing16}
      width="50%"
      transform="translateY(25%)"
    >
      <LegacyStyledText as="h2">
        No protocol timeline to display. Create a protocol and press "Execute"
        to see the timeline.
      </LegacyStyledText>
    </Flex>
  )
  if (
    jsonAnalysis != null &&
    code !== '' &&
    jsonAnalysis.robotType === FLEX_ROBOT_TYPE &&
    error == null &&
    jsonAnalysis.errors.length === 0
  ) {
    display = (
      <Box width="50%" padding={SPACING.spacing16}>
        <ProtocolTimelineScrubber
          isCreateMode
          commands={jsonAnalysis.commands}
          analysis={jsonAnalysis}
          robotType={jsonAnalysis.robotType}
        />
      </Box>
    )
  } else if (jsonAnalysis != null && jsonAnalysis.errors.length > 0) {
    display = (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        textAlign={ALIGN_CENTER}
        padding={SPACING.spacing16}
        width="50%"
        transform="translateY(25%)"
      >
        {jsonAnalysis.errors.map(error => (
          <LegacyStyledText as="h2" color={COLORS.red50}>
            {error.errorType}
            {error.detail}
          </LegacyStyledText>
        ))}
      </Flex>
    )
  } else if (error != null) {
    display = (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        textAlign={ALIGN_CENTER}
        padding={SPACING.spacing16}
        width="50%"
        transform="translateY(25%)"
      >
        {error}
      </Flex>
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} margin={SPACING.spacing16}>
        <PrimaryButton onClick={goBack}>{t('shared:go_back')}</PrimaryButton>
        <LegacyStyledText as="h1">{t('create_a_protocol')}</LegacyStyledText>
        <Flex gridGap={SPACING.spacing4}>
          <SecondaryButton
            onClick={onExecute}
            disabled={code == null || code === ''}
            css={css`
              cursor: ${code == null || code === '' ? 'default' : 'pointer'};
            `}
          >
            {t('execute')}
          </SecondaryButton>
          <PrimaryButton
            disabled={
              jsonAnalysis == null ||
              jsonAnalysis.errors.length > 0 ||
              error != null
            }
            onClick={() => {
              goBack
              console.log(
                'wire this up but should save the protocol and add to the robot list'
              )
            }}
          >
            {i18n.format(t('shared:save'), 'capitalize')}
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
        {display}
      </Flex>
    </Flex>
  )
}
