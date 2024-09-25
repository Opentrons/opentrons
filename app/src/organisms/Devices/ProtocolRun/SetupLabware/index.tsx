import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import {
  JUSTIFY_CENTER,
  Flex,
  SPACING,
  PrimaryButton,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { useToggleGroup } from '/app/molecules/ToggleGroup/useToggleGroup'
import { getModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'
import {
  useMostRecentCompletedAnalysis,
  useModuleRenderInfoForProtocolById,
} from '/app/resources/runs'
import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { SetupLabwareMap } from './SetupLabwareMap'
import { SetupLabwareList } from './SetupLabwareList'

interface SetupLabwareProps {
  robotName: string
  runId: string
  labwareConfirmed: boolean
  setLabwareConfirmed: (confirmed: boolean) => void
}

export function SetupLabware(props: SetupLabwareProps): JSX.Element {
  const { robotName, runId, labwareConfirmed, setLabwareConfirmed } = props
  const { t } = useTranslation('protocol_setup')
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view') as string,
    t('map_view') as string
  )
  const isFlex = useIsFlex(robotName)

  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(runId)
  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing32}
      >
        {toggleGroup}
        {selectedValue === t('list_view') ? (
          <SetupLabwareList
            attachedModuleInfo={moduleRenderInfoById}
            commands={protocolAnalysis?.commands ?? []}
            extraAttentionModules={moduleTypesThatRequireExtraAttention}
            isFlex={isFlex}
          />
        ) : (
          <SetupLabwareMap runId={runId} protocolAnalysis={protocolAnalysis} />
        )}
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing16}>
        <PrimaryButton
          onClick={() => {
            setLabwareConfirmed(true)
          }}
          disabled={labwareConfirmed}
        >
          {t('confirm_placements')}
        </PrimaryButton>
      </Flex>
    </>
  )
}
