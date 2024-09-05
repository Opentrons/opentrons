import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  ListItem,
  ListItemDescriptor,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE, getPipetteSpecsV2 } from '@opentrons/shared-data'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { selectors as fileSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions as loadFileActions } from '../../load-file'
import {
  getUnusedEntities,
  getUnusedStagingAreas,
  getUnusedTrash,
} from '../../components/FileSidebar/utils'
import { resetScrollElements } from '../../ui/steps/utils'
import { useBlockingHint } from '../../components/Hints/useBlockingHint'
import { v8WarningContent } from '../../components/FileSidebar/FileSidebar'

import type { CreateCommand, PipetteName } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../types'
import type { HintKey } from '../../tutorial'

const DATE_ONLY_FORMAT = 'MMMM dd, yyyy'
const DATETIME_FORMAT = 'MMMM dd, yyyy | h:mm a'

const LOAD_COMMANDS: Array<CreateCommand['commandType']> = [
  'loadLabware',
  'loadModule',
  'loadPipette',
  'loadLiquid',
]

interface Fixture {
  trashBin: boolean
  wasteChute: boolean
  stagingAreaSlots: string[]
}

export function ProtocolOverview(): JSX.Element {
  const { t } = useTranslation(['protocol_overview', 'alert', 'shared'])
  const navigate = useNavigate()
  const formValues = useSelector(fileSelectors.getFileMetadata)
  const robotType = useSelector(fileSelectors.getRobotType)
  const deckSetup = useSelector(getInitialDeckSetup)

  const dispatch: ThunkDispatch<any> = useDispatch()
  const [showBlockingHint, setShowBlockingHint] = React.useState<boolean>(false)
  const fileData = useSelector(fileSelectors.createFile)
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const savedStepForms = useSelector(stepFormSelectors.getSavedStepForms)
  const modulesOnDeck = initialDeckSetup.modules

  const nonLoadCommands =
    fileData?.commands.filter(
      command => !LOAD_COMMANDS.includes(command.commandType)
    ) ?? []
  const gripperInUse =
    fileData?.commands.find(
      command =>
        command.commandType === 'moveLabware' &&
        command.params.strategy === 'usingGripper'
    ) != null
  const noCommands = fileData != null ? nonLoadCommands.length === 0 : true
  const modulesWithoutStep = getUnusedEntities(
    modulesOnDeck,
    savedStepForms,
    'moduleId',
    robotType
  )
  const pipettesWithoutStep = getUnusedEntities(
    deckSetup.pipettes,
    savedStepForms,
    'pipette',
    robotType
  )
  const isGripperAttached = Object.values(
    deckSetup.additionalEquipmentOnDeck
  ).some(equipment => equipment?.name === 'gripper')
  const gripperWithoutStep = isGripperAttached && !gripperInUse

  const { trashBinUnused, wasteChuteUnused } = getUnusedTrash(
    deckSetup.additionalEquipmentOnDeck,
    fileData?.commands
  )
  const fixtureWithoutStep: Fixture = {
    trashBin: trashBinUnused,
    wasteChute: wasteChuteUnused,
    stagingAreaSlots: getUnusedStagingAreas(
      deckSetup.additionalEquipmentOnDeck,
      fileData?.commands
    ),
  }

  const additionalEquipmentOnDeck = Object.values(
    deckSetup.additionalEquipmentOnDeck
  )
  const pipettesOnDeck = Object.values(deckSetup.pipettes)
  const leftPip = pipettesOnDeck.find(pip => pip.mount === 'left')
  const rightPip = pipettesOnDeck.find(pip => pip.mount === 'right')
  const gripper = additionalEquipmentOnDeck.find(ae => ae.name === 'gripper')
  const {
    protocolName,
    description,
    created,
    lastModified,
    author,
  } = formValues
  const metaDataInfo = [
    { description },
    { author },
    { created: created != null ? format(created, DATE_ONLY_FORMAT) : t('na') },
    {
      modified:
        lastModified != null ? format(lastModified, DATETIME_FORMAT) : t('na'),
    },
  ]

  const hasWarning =
    noCommands ||
    modulesWithoutStep.length > 0 ||
    pipettesWithoutStep.length > 0 ||
    gripperWithoutStep ||
    fixtureWithoutStep.trashBin ||
    fixtureWithoutStep.wasteChute ||
    fixtureWithoutStep.stagingAreaSlots.length > 0

  const getExportHintContent = (): {
    hintKey: HintKey
    content: React.ReactNode
  } => {
    return {
      hintKey: t('alert:export_v8_1_protocol_7_3'),
      content: v8WarningContent(t),
    }
  }

  const { hintKey, content } = getExportHintContent()

  const blockingExportHint = useBlockingHint({
    enabled: showBlockingHint,
    hintKey,
    content,
    handleCancel: () => {
      setShowBlockingHint(false)
    },
    handleContinue: () => {
      setShowBlockingHint(false)
      dispatch(loadFileActions.saveProtocolFile())
    },
  })

  return (
    <>
      {blockingExportHint}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing60} ${SPACING.spacing80}`}
        gridGap={SPACING.spacing60}
      >
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing60}
        >
          <Flex flex="1">
            <StyledText
              desktopStyle="displayBold"
              css={PROTOCOL_NAME_TEXT_STYLE}
            >
              {protocolName ?? t('untitled_protocol')}
            </StyledText>
          </Flex>

          <Flex
            gridGap={SPACING.spacing8}
            flex="1"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_FLEX_END}
          >
            <LargeButton
              buttonType="stroke"
              buttonText={t('edit_protocol')}
              onClick={() => {
                navigate('/designer')
              }}
              whiteSpace="nowrap"
              height="3.5rem"
            />
            <LargeButton
              buttonText={t('export_protocol')}
              onClick={() => {
                //  ToDo (kk:08/26/2024) should use hasWarning later
                if (!hasWarning) {
                  resetScrollElements()
                  // ToDo (kk:08/26/2024) create warning modal
                } else {
                  resetScrollElements()
                  setShowBlockingHint(true)
                }
              }}
              iconName="arrow-right"
              whiteSpace="nowrap"
            />
          </Flex>
        </Flex>
        <Flex gridGap={SPACING.spacing80}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            width="50%"
            gridGap={SPACING.spacing40}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                marginBottom={SPACING.spacing12}
              >
                <StyledText desktopStyle="headingSmallBold">
                  {t('protocol_metadata')}
                </StyledText>
                <Btn
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={() => {
                    console.log('wire this up')
                  }}
                >
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('edit')}
                  </StyledText>
                </Btn>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                {metaDataInfo.map(info => {
                  const [title, value] = Object.entries(info)[0]

                  return (
                    <ListItem type="noActive" key={`ProtocolOverview_${title}`}>
                      <ListItemDescriptor
                        type="default"
                        description={t(`${title}`)}
                        content={value ?? 'N/A'}
                      />
                    </ListItem>
                  )
                })}
              </Flex>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                marginBottom={SPACING.spacing12}
              >
                <StyledText desktopStyle="headingSmallBold">
                  {t('instruments')}
                </StyledText>
                <Btn
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={() => {
                    console.log('wire this up')
                  }}
                >
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('edit')}
                  </StyledText>
                </Btn>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                <ListItem type="noActive" key={`ProtocolOverview_robotType`}>
                  <ListItemDescriptor
                    type="default"
                    description={t('robotType')}
                    content={
                      robotType === FLEX_ROBOT_TYPE
                        ? t('shared:opentrons_flex')
                        : t('shared:ot2')
                    }
                  />
                </ListItem>
                <ListItem type="noActive" key={`ProtocolOverview_left`}>
                  <ListItemDescriptor
                    type="default"
                    description={t('left_pip')}
                    content={
                      leftPip != null
                        ? getPipetteSpecsV2(leftPip.name as PipetteName)
                            ?.displayName ?? 'N/A'
                        : 'N/A'
                    }
                  />
                </ListItem>
                <ListItem type="noActive" key={`ProtocolOverview_right`}>
                  <ListItemDescriptor
                    type="default"
                    description={t('right_pip')}
                    content={
                      rightPip != null
                        ? getPipetteSpecsV2(rightPip.name as PipetteName)
                            ?.displayName ?? 'N/A'
                        : 'N/A'
                    }
                  />
                </ListItem>
                {robotType === FLEX_ROBOT_TYPE ? (
                  <ListItem type="noActive" key={`ProtocolOverview_gripper`}>
                    <ListItemDescriptor
                      type="default"
                      description={t('extension')}
                      content={gripper != null ? t(`$gripper.name}`) : 'N/A'}
                    />
                  </ListItem>
                ) : null}
              </Flex>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex marginBottom={SPACING.spacing12}>
                <StyledText desktopStyle="headingSmallBold">
                  {t('liquids')}
                </StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                <ListItem type="noActive" key={`ProtocolOverview_Liquids`}>
                  <ListItemDescriptor
                    type="default"
                    description={'TODO'}
                    content={'WIRE THIS UP'}
                  />
                </ListItem>
              </Flex>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex marginBottom={SPACING.spacing12}>
                <StyledText desktopStyle="headingSmallBold">
                  {t('step')}
                </StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                <ListItem type="noActive" key={`ProtocolOverview_Step`}>
                  <ListItemDescriptor
                    type="default"
                    description={'TODO'}
                    content={'WIRE THIS UP'}
                  />
                </ListItem>
              </Flex>
            </Flex>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} width="50%">
            <Flex
              marginBottom={SPACING.spacing12}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <StyledText desktopStyle="headingSmallBold">
                {t('starting_deck')}
              </StyledText>
              <Btn
                data-testid="Materials_list"
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                onClick={() => {
                  // ToDo (kk:08/27/2024) wire up material list modal
                  console.log('open material list modal')
                }}
              >
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('materials_list')}
                </StyledText>
              </Btn>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              TODO: wire this up
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

const PROTOCOL_NAME_TEXT_STYLE = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: 3;
`
