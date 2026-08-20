import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import mapValues from 'lodash/mapValues'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import { INITIAL_DECK_SETUP_STEP_ID } from '/protocol-designer/constants'
import { toggleIsGripperRequired } from '/protocol-designer/step-forms/actions/additionalItems'
import { getAdditionalEquipmentEntities } from '/protocol-designer/step-forms/selectors'
import { changeSavedStepForm } from '/protocol-designer/steplist/actions'

import { PipetteInfoItem } from '../PipetteInfoItem'
import { getSectionsFromPipetteName } from './utils'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { RobotType } from '@opentrons/shared-data'
import type { AdditionalEquipmentName } from '@opentrons/step-generation'
import type {
  AllTemporalPropertiesForTimelineFrame,
  PipetteOnDeck,
} from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'
import type { PipetteConfig } from './usePipetteConfig'

interface Gripper {
  name: AdditionalEquipmentName
  id: string
  location?: string
}

interface PipetteOverviewProps {
  has96Channel: boolean
  pipettes: AllTemporalPropertiesForTimelineFrame['pipettes']
  labware: AllTemporalPropertiesForTimelineFrame['labware']
  robotType: RobotType
  pipetteConfig: PipetteConfig
  showNoPipetteError: boolean
  setSaveAttemptFailed: Dispatch<SetStateAction<boolean>>
  leftPipette?: PipetteOnDeck
  rightPipette?: PipetteOnDeck
  gripper?: Gripper
}

export function PipetteOverview({
  has96Channel,
  pipettes,
  labware,
  robotType,
  pipetteConfig,
  showNoPipetteError,
  setSaveAttemptFailed,
  leftPipette,
  rightPipette,
  gripper,
}: PipetteOverviewProps): ReactNode {
  const { t } = useTranslation(['onboarding', 'protocol_overview'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const gripperId = Object.values(additionalEquipmentEntities).find(
    ae => ae.name === 'gripper'
  )?.id

  const swapPipetteUpdate = mapValues(pipettes, pipette => {
    if (!pipette.mount) return pipette.mount
    return pipette.mount === 'left' ? 'right' : 'left'
  })

  const rightInfo =
    rightPipette != null
      ? getSectionsFromPipetteName(rightPipette.name, rightPipette.spec)
      : null
  const leftInfo =
    leftPipette != null
      ? getSectionsFromPipetteName(leftPipette.name, leftPipette.spec)
      : null

  const {
    setPage,
    setMount,
    setPipetteType,
    setPipetteGen,
    setPipetteVolume,
    setSelectedTips,
    temporarilyDeletedPipettes,
    setTemporarilyDeletedPipettes,
  } = pipetteConfig

  const visibleLeftPipette =
    leftPipette != null && !temporarilyDeletedPipettes.includes(leftPipette.id)
      ? leftPipette
      : null
  const visibleRightPipette =
    rightPipette != null &&
    !temporarilyDeletedPipettes.includes(rightPipette.id)
      ? rightPipette
      : null

  const targetPipetteMount = visibleLeftPipette == null ? 'left' : 'right'

  const effectiveHas96Channel =
    (has96Channel &&
      leftPipette?.spec.channels === 96 &&
      !temporarilyDeletedPipettes.includes(leftPipette.id)) ||
    (rightPipette?.spec.channels === 96 &&
      !temporarilyDeletedPipettes.includes(rightPipette.id))

  const handleAddPipette = (): void => {
    setPage('add')
    setMount(targetPipetteMount)
    setSaveAttemptFailed(false)
  }

  const isLeftPipette96Channel =
    visibleLeftPipette != null && visibleLeftPipette.spec.channels === 96
  const isRightPipette96Channel =
    visibleRightPipette != null && visibleRightPipette.spec.channels === 96

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('your_pipettes')}
          </StyledText>
          {effectiveHas96Channel ||
          (leftPipette == null && rightPipette == null) ? null : (
            <Btn
              css={LINK_BUTTON_STYLE}
              onClick={() =>
                dispatch(
                  changeSavedStepForm({
                    stepId: INITIAL_DECK_SETUP_STEP_ID,
                    update: {
                      pipetteLocationUpdate: swapPipetteUpdate,
                    },
                  })
                )
              }
            >
              <Flex flexDirection={DIRECTION_ROW}>
                <Icon
                  name="swap-horizontal"
                  size="1rem"
                  transform="rotate(90deg)"
                />
                <StyledText desktopStyle="captionSemiBold">
                  {t('swap_pipette_mounts')}
                </StyledText>
              </Flex>
            </Btn>
          )}
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {/* Show 96-channel pipette as Left + Right Mount regardless of actual mount */}
          {isLeftPipette96Channel || isRightPipette96Channel ? (
            <PipetteInfoItem
              mount="left" // Always use "left" for display, but PipetteInfoItem will show "Left + Right Mount"
              pipetteName={
                isLeftPipette96Channel
                  ? visibleLeftPipette.name
                  : (visibleRightPipette?.name ?? 'p1000_96')
              }
              tiprackDefURIs={
                (isLeftPipette96Channel
                  ? visibleLeftPipette.tiprackDefURI
                  : visibleRightPipette?.tiprackDefURI)!
              }
              editClick={() => {
                const pipette96 = isLeftPipette96Channel
                  ? visibleLeftPipette
                  : visibleRightPipette
                const info96 = isLeftPipette96Channel ? leftInfo : rightInfo
                if (pipette96 && info96) {
                  setPage('add')
                  setMount(pipette96.mount)
                  setPipetteType(info96.type)
                  setPipetteGen(info96.gen)
                  setPipetteVolume(info96.volume)
                  setSelectedTips(pipette96.tiprackDefURI)
                }
              }}
              cleanForm={() => {
                const pipette96 = isLeftPipette96Channel
                  ? visibleLeftPipette
                  : visibleRightPipette
                if (pipette96) {
                  setTemporarilyDeletedPipettes(prev => [...prev, pipette96.id])
                }
              }}
            />
          ) : (
            <>
              {/* Show regular pipettes only if no 96-channel */}
              {visibleLeftPipette?.tiprackDefURI != null &&
              leftInfo != null &&
              leftPipette != null ? (
                <PipetteInfoItem
                  mount="left"
                  pipetteName={leftPipette.name}
                  tiprackDefURIs={leftPipette.tiprackDefURI}
                  editClick={() => {
                    setPage('add')
                    setMount('left')
                    setPipetteType(leftInfo.type)
                    setPipetteGen(leftInfo.gen)
                    setPipetteVolume(leftInfo.volume)
                    setSelectedTips(leftPipette.tiprackDefURI)
                  }}
                  cleanForm={() => {
                    setTemporarilyDeletedPipettes(prev => [
                      ...prev,
                      leftPipette.id,
                    ])
                  }}
                />
              ) : null}
              {visibleRightPipette?.tiprackDefURI != null &&
              rightInfo != null &&
              rightPipette != null ? (
                <PipetteInfoItem
                  mount="right"
                  pipetteName={rightPipette.name}
                  tiprackDefURIs={rightPipette.tiprackDefURI}
                  editClick={() => {
                    setPage('add')
                    setMount('right')
                    setPipetteType(rightInfo.type)
                    setPipetteGen(rightInfo.gen)
                    setPipetteVolume(rightInfo.volume)
                    setSelectedTips(rightPipette.tiprackDefURI)
                  }}
                  cleanForm={() => {
                    setTemporarilyDeletedPipettes(prev => [
                      ...prev,
                      rightPipette.id,
                    ])
                  }}
                />
              ) : null}
            </>
          )}
          {effectiveHas96Channel ||
          (leftPipette != null && rightPipette != null) ? null : (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              <Flex width={FLEX_MAX_CONTENT}>
                <EmptySelectorButton
                  onClick={handleAddPipette}
                  text={t('add_pipette')}
                  textAlignment="left"
                  iconName="plus"
                />
              </Flex>
              {showNoPipetteError ? (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.red50}
                >
                  {t('pipette_required')}
                </StyledText>
              ) : null}
            </Flex>
          )}
        </Flex>
      </Flex>
      {robotType === FLEX_ROBOT_TYPE ? (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('protocol_overview:your_gripper')}
            </StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {gripper != null ? (
              <ListItem type="default">
                <Flex
                  padding={SPACING.spacing12}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  width="100%"
                >
                  <Flex
                    gridGap={SPACING.spacing4}
                    flexDirection={DIRECTION_COLUMN}
                  >
                    <StyledText desktopStyle="bodyDefaultSemiBold">
                      {t('protocol_overview:extension')}
                    </StyledText>
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      color={COLORS.grey60}
                    >
                      {t('protocol_overview:gripper')}
                    </StyledText>
                  </Flex>
                  <Btn
                    css={LINK_BUTTON_STYLE}
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    padding={SPACING.spacing4}
                    onClick={() => {
                      dispatch(toggleIsGripperRequired(gripperId))
                    }}
                  >
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t('remove')}
                    </StyledText>
                  </Btn>
                </Flex>
              </ListItem>
            ) : (
              <Flex width={FLEX_MAX_CONTENT}>
                <EmptySelectorButton
                  onClick={() => {
                    dispatch(toggleIsGripperRequired())
                  }}
                  text={t('protocol_overview:add_gripper')}
                  textAlignment="left"
                  iconName="plus"
                />
              </Flex>
            )}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}
