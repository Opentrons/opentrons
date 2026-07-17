import { useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  SPACING,
  Tabs,
} from '@opentrons/components'
import {
  getQueryKey,
  useCreateProtocolMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import {
  ANALYTICS_QUICK_TRANSFER_RUN_NOW,
  ANALYTICS_QUICK_TRANSFER_SAVE_FOR_LATER,
  ANALYTICS_QUICK_TRANSFER_TIME_TO_CREATE,
} from '/app/redux/analytics'
import { useFeatureFlag } from '/app/redux/config'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { Aspirate } from './Aspirate'
import { Dispense } from './Dispense'
import { Overview } from './Overview'
import { quickTransferSummaryReducer } from './reducers'
import { SaveOrRunModal } from './SaveOrRunModal'
import { initializeSummaryState } from './utils'
import { createQuickTransferPythonFile } from './utils/createQuickTransferFile'

import type { ComponentProps } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type { QuickTransferWizardState } from './types'
import type { InitialSummaryStateProps } from './utils/getInitialSummaryState'

interface SummaryAndSettingsProps {
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  analyticsStartTime: Date
}

export function SummaryAndSettings(
  props: SummaryAndSettingsProps
): JSX.Element | null {
  const { exitButtonProps, state: wizardFlowState, analyticsStartTime } = props
  const navigate = useNavigate()
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const queryClient = useQueryClient()
  const host = useHost()
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [showSaveOrRunModal, setShowSaveOrRunModal] = useState<boolean>(false)
  const enableProtocolContentsLog = useFeatureFlag(
    'quickTransferProtocolContentsLog'
  )

  const displayCategory: string[] = ['overview', 'aspirate', 'dispense']

  const [selectedCategory, setSelectedCategory] = useState<string>('overview')
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const [state, dispatch] = useReducer(
    quickTransferSummaryReducer,
    { state: wizardFlowState as InitialSummaryStateProps['state'], deckConfig },
    initializeSummaryState
  )

  const { mutateAsync: createProtocolAsync } = useCreateProtocolMutation()

  const { createRun } = useCreateRunMutation(
    {
      onSuccess: data => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        navigate(`/runs/${data.data.id}/setup`)
      },
    },
    host
  )

  const isMultiTransferDispense = state?.path === 'multiDispense'

  const handleClickCreateTransfer = (): void => {
    setShowSaveOrRunModal(true)
    const duration = new Date().getTime() - analyticsStartTime.getTime()
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_TIME_TO_CREATE,
      properties: {
        duration: `${duration / 1000} seconds`,
      },
    })
  }

  const handleClickSave = (protocolName: string): void => {
    const protocolFile = createQuickTransferPythonFile(
      state,
      deckConfig,
      protocolName,
      enableProtocolContentsLog
    )

    createProtocolAsync({
      files: [protocolFile],
      protocolKind: 'quick-transfer',
    }).then(() => {
      navigate('/protocols')
    })
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_SAVE_FOR_LATER,
      properties: {
        name: protocolName,
      },
    })
  }

  const handleClickRun = (): void => {
    const protocolFile = createQuickTransferPythonFile(
      state,
      deckConfig,
      undefined,
      enableProtocolContentsLog
    )

    createProtocolAsync({
      files: [protocolFile],
      protocolKind: 'quick-transfer',
    }).then(data => {
      createRun({
        protocolId: data.data.id,
      })
    })
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_RUN_NOW,
      properties: {},
    })
  }

  return showSaveOrRunModal ? (
    <SaveOrRunModal onSave={handleClickSave} onRun={handleClickRun} />
  ) : (
    <Flex>
      <ChildNavigation
        header={t('quick_transfer_volume', { volume: wizardFlowState.volume })}
        buttonText={t('create_transfer')}
        onClickButton={handleClickCreateTransfer}
        secondaryButtonProps={exitButtonProps}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing40}`}
        width="100%"
      >
        <Flex
          backgroundColor={COLORS.white}
          width="100%"
          position={POSITION_FIXED}
          top="7.5rem"
          alignItems={ALIGN_CENTER}
        >
          <Tabs
            tabs={displayCategory.map(category => ({
              text: t(category),
              onClick: () => {
                setSelectedCategory(category)
              },
              isActive: category === selectedCategory,
              disabled: false,
            }))}
          />
        </Flex>
        {selectedCategory === 'overview' ? <Overview state={state} /> : null}
        <>
          {selectedCategory === 'aspirate' ? (
            <Aspirate
              state={state}
              dispatch={dispatch}
              isMultiTransfer={isMultiTransferDispense}
            />
          ) : null}
          {selectedCategory === 'dispense' ? (
            <Dispense
              state={state}
              dispatch={dispatch}
              isMultiTransfer={isMultiTransferDispense}
            />
          ) : null}
        </>
      </Flex>
    </Flex>
  )
}
