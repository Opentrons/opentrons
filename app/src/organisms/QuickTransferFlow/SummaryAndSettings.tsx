import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useQueryClient } from 'react-query'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  COLORS,
  POSITION_FIXED,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  useCreateProtocolMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import { TabbedButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { Overview } from './Overview'
import { TipManagement } from './TipManagement'
import { SaveOrRunModal } from './SaveOrRunModal'
import { getInitialSummaryState, createQuickTransferFile } from './utils'
import { quickTransferSummaryReducer } from './reducers'

import type { SmallButton } from '../../atoms/buttons'
import type { QuickTransferWizardState } from './types'

interface SummaryAndSettingsProps {
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
}

export function SummaryAndSettings(
  props: SummaryAndSettingsProps
): JSX.Element | null {
  const { exitButtonProps, state: wizardFlowState } = props
  const history = useHistory()
  const queryClient = useQueryClient()
  const host = useHost()
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [showSaveOrRunModal, setShowSaveOrRunModal] = React.useState<boolean>(
    false
  )

  const displayCategory: string[] = [
    'overview',
    'advanced_settings',
    'tip_management',
  ]
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    'overview'
  )
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const initialSummaryState = getInitialSummaryState({
    // @ts-expect-error TODO figure out how to make this type non-null as we know
    // none of these values will be undefined
    state: wizardFlowState,
    deckConfig,
  })
  const [state, dispatch] = React.useReducer(
    quickTransferSummaryReducer,
    initialSummaryState
  )
  // TODO: adjust this mutation to add the quick transfer query parameter
  const { mutateAsync: createProtocolAsync } = useCreateProtocolMutation()

  const { createRun } = useCreateRunMutation(
    {
      onSuccess: data => {
        queryClient.invalidateQueries([host, 'runs']).catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
        history.push(`/runs/${data.data.id}/setup`)
      },
    },
    host
  )

  const handleClickSave = (protocolName: string): void => {
    const protocolFile = createQuickTransferFile(
      state,
      deckConfig,
      protocolName
    )
    createProtocolAsync({ files: [protocolFile] }).then(data => {
      history.push(`protocols/${data.data.id}`)
    })
  }

  const handleClickRun = (): void => {
    const protocolFile = createQuickTransferFile(state, deckConfig)
    createProtocolAsync({ files: [protocolFile] }).then(data => {
      createRun({
        protocolId: data.data.id,
      })
    })
  }

  return showSaveOrRunModal ? (
    <SaveOrRunModal onSave={handleClickSave} onRun={handleClickRun} />
  ) : (
    <Flex>
      <ChildNavigation
        header={t('quick_transfer_volume', { volume: wizardFlowState.volume })}
        buttonText={t('create_transfer')}
        onClickButton={() => {
          setShowSaveOrRunModal(true)
        }}
        secondaryButtonProps={exitButtonProps}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing40}`}
        width="100%"
      >
        <Flex
          gridGap={SPACING.spacing8}
          height={SPACING.spacing80}
          backgroundColor={COLORS.white}
          width="100%"
          flexDirection={DIRECTION_ROW}
          position={POSITION_FIXED}
          top={SPACING.spacing120}
          marginBottom={SPACING.spacing24}
          alignItems={ALIGN_CENTER}
        >
          {displayCategory.map(category => (
            <TabbedButton
              key={category}
              title={category}
              isSelected={category === selectedCategory}
              onClick={() => {
                setSelectedCategory(category)
              }}
              height={SPACING.spacing60}
            >
              {t(category)}
            </TabbedButton>
          ))}
        </Flex>
        {selectedCategory === 'overview' ? <Overview state={state} /> : null}
        {selectedCategory === 'tip_management' ? (
          <TipManagement state={state} dispatch={dispatch} />
        ) : null}
      </Flex>
    </Flex>
  )
}
