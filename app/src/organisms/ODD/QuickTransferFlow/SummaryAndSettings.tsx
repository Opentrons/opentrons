import { useEffect, useReducer, useState } from 'react'
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
import {
  createQuickTransferFile,
  getInitialSummaryState,
  retrieveLiquidClassValues,
} from './utils'
import { createQuickTransferPythonFile } from './utils/createQuickTransferFile'

import type { ComponentProps } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type { QuickTransferWizardState } from './types'

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
  const enableExportPython = useFeatureFlag('quickTransferExportPython')

  const displayCategory: string[] = ['overview', 'aspirate', 'dispense']

  const [selectedCategory, setSelectedCategory] = useState<string>('overview')
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const initialSummaryState = getInitialSummaryState({
    // @ts-expect-error TODO figure out how to make this type non-null as we know
    // none of these values will be undefined
    state: wizardFlowState,
    deckConfig,
  })
  const [state, dispatch] = useReducer(
    quickTransferSummaryReducer,
    initialSummaryState
  )

  const { mutateAsync: createProtocolAsync } = useCreateProtocolMutation()

  const { createRun } = useCreateRunMutation(
    {
      onSuccess: data => {
        queryClient.invalidateQueries([host, 'runs']).catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
        navigate(`/runs/${data.data.id}/setup`)
      },
    },
    host
  )

  useEffect(() => {
    if (!state.liquidClassValuesInitialized) {
      const liquidClassValues = retrieveLiquidClassValues(state, 'all')
      dispatch({
        type: 'SET_LIQUID_CLASS_VALUES',
        liquidClassValues: {
          ...liquidClassValues,
          liquidClassValuesInitialized: true,
        },
      })
    }
  })

  const isMultiTransferAspirate = state?.path === 'multiAspirate'
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
    const protocolFile = enableExportPython
      ? createQuickTransferPythonFile(state, deckConfig, protocolName)
      : createQuickTransferFile(state, deckConfig, protocolName)

    createProtocolAsync({
      files: [protocolFile],
      protocolKind: 'quick-transfer',
    }).then(() => {
      navigate('/quick-transfer')
    })
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_SAVE_FOR_LATER,
      properties: {
        name: protocolName,
      },
    })
  }

  const handleClickRun = (): void => {
    const protocolFile = enableExportPython
      ? createQuickTransferPythonFile(state, deckConfig)
      : createQuickTransferFile(state, deckConfig)

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
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing40}`} // TODO Ian 2023-05-02: remove this padding
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
              isMultiTransfer={isMultiTransferAspirate}
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
