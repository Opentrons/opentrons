import { Fragment, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import { css } from 'styled-components'
import { createPortal } from 'react-dom'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  JUSTIFY_END,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  ListItem,
  ListItemDescriptor,
  Modal,
  NO_WRAP,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  ToggleGroup,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getPipetteSpecsV2,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
} from '../../step-forms/selectors'
import { selectors as fileSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { actions as loadFileActions } from '../../load-file'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import {
  getUnusedEntities,
  getUnusedStagingAreas,
  getUnusedTrash,
} from '../../components/FileSidebar/utils'
import { MaterialsListModal } from '../../organisms/MaterialsListModal'
import { BUTTON_LINK_STYLE } from '../../atoms'
import { getMainPagePortalEl } from '../../components/portals/MainPageModalPortal'
import {
  EditProtocolMetadataModal,
  EditInstrumentsModal,
  SlotDetailsContainer,
} from '../../organisms'
import { DeckThumbnail } from './DeckThumbnail'
import { OffDeckThumbnail } from './OffdeckThumbnail'
import { getWarningContent } from './UnusedModalContent'
import { LiquidDefinitions } from './LiquidDefinitions'

import type { CreateCommand, PipetteName } from '@opentrons/shared-data'
import type { DeckSlot } from '@opentrons/step-generation'
import type { ThunkDispatch } from '../../types'

const REQUIRED_APP_VERSION = '8.0.0'
const DATE_ONLY_FORMAT = 'MMMM dd, yyyy'
const DATETIME_FORMAT = 'MMMM dd, yyyy | h:mm a'

const LOAD_COMMANDS: Array<CreateCommand['commandType']> = [
  'loadLabware',
  'loadModule',
  'loadPipette',
  'loadLiquid',
]

export interface Fixture {
  trashBin: boolean
  wasteChute: boolean
  stagingAreaSlots: string[]
}

export function ProtocolOverview(): JSX.Element {
  const { t } = useTranslation([
    'protocol_overview',
    'alert',
    'shared',
    'starting_deck_State',
  ])
  const navigate = useNavigate()
  const [
    showEditInstrumentsModal,
    setShowEditInstrumentsModal,
  ] = useState<boolean>(false)
  const [showEditMetadataModal, setShowEditMetadataModal] = useState<boolean>(
    false
  )
  const [showExportWarningModal, setShowExportWarningModal] = useState<boolean>(
    false
  )
  const formValues = useSelector(fileSelectors.getFileMetadata)
  const robotType = useSelector(fileSelectors.getRobotType)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const allIngredientGroupFields = useSelector(
    labwareIngredSelectors.allIngredientGroupFields
  )
  const dispatch: ThunkDispatch<any> = useDispatch()
  const [hover, setHover] = useState<DeckSlot | string | null>(null)
  const [showMaterialsListModal, setShowMaterialsListModal] = useState<boolean>(
    false
  )
  const fileData = useSelector(fileSelectors.createFile)
  const savedStepForms = useSelector(stepFormSelectors.getSavedStepForms)
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const liquidsOnDeck = useSelector(
    labwareIngredSelectors.allIngredientNamesIds
  )
  const leftString = t('starting_deck_state:onDeck')
  const rightString = t('starting_deck_state:offDeck')

  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)

  useEffect(() => {
    if (formValues?.created == null) {
      console.warn(
        'formValues was refreshed while on the overview page, redirecting to landing page'
      )
      navigate('/')
    }
  }, [formValues])

  const {
    modules: modulesOnDeck,
    labware: labwaresOnDeck,
    additionalEquipmentOnDeck,
    pipettes,
  } = initialDeckSetup
  const isOffDeckHover = hover != null && labwaresOnDeck[hover] != null

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
    initialDeckSetup.pipettes,
    savedStepForms,
    'pipette',
    robotType
  )
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )
  const gripperWithoutStep = isGripperAttached && !gripperInUse

  const { trashBinUnused, wasteChuteUnused } = getUnusedTrash(
    additionalEquipmentOnDeck,
    fileData?.commands
  )
  const fixtureWithoutStep: Fixture = {
    trashBin: trashBinUnused,
    wasteChute: wasteChuteUnused,
    stagingAreaSlots: getUnusedStagingAreas(
      additionalEquipmentOnDeck,
      fileData?.commands
    ),
  }

  const pipettesOnDeck = Object.values(pipettes)
  const leftPip = pipettesOnDeck.find(pip => pip.mount === 'left')
  const rightPip = pipettesOnDeck.find(pip => pip.mount === 'right')
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

  const warning =
    hasWarning &&
    getWarningContent({
      noCommands,
      pipettesWithoutStep,
      modulesWithoutStep,
      gripperWithoutStep,
      fixtureWithoutStep,
      t,
    })

  const cancelModal = (): void => {
    setShowExportWarningModal(false)
  }

  return (
    <Fragment>
      {showEditMetadataModal ? (
        <EditProtocolMetadataModal
          onClose={() => {
            setShowEditMetadataModal(false)
          }}
        />
      ) : null}
      {showEditInstrumentsModal ? (
        <EditInstrumentsModal
          onClose={() => {
            setShowEditInstrumentsModal(false)
          }}
        />
      ) : null}
      {showExportWarningModal &&
        createPortal(
          <Modal
            title={warning && warning.heading}
            onClose={cancelModal}
            footer={
              <Flex
                justifyContent={JUSTIFY_END}
                gridGap={SPACING.spacing8}
                padding={SPACING.spacing12}
              >
                <SecondaryButton onClick={cancelModal}>
                  {t('shared:cancel')}
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => {
                    setShowExportWarningModal(false)
                    dispatch(loadFileActions.saveProtocolFile())
                  }}
                >
                  {t('alert:continue_with_export')}
                </PrimaryButton>
              </Flex>
            }
          >
            {warning && warning.content}
          </Modal>,
          getMainPagePortalEl()
        )}
      {showMaterialsListModal ? (
        <MaterialsListModal
          hardware={Object.values(modulesOnDeck)}
          fixtures={
            robotType === OT2_ROBOT_TYPE
              ? Object.values(additionalEquipmentOnDeck)
              : []
          }
          labware={Object.values(labwaresOnDeck)}
          liquids={liquidsOnDeck}
          setShowMaterialsListModal={setShowMaterialsListModal}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing60} ${SPACING.spacing80}`}
        gridGap={SPACING.spacing60}
        width="100%"
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
              {protocolName != null && protocolName !== ''
                ? protocolName
                : t('untitled_protocol')}
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
              whiteSpace={NO_WRAP}
              height="3.5rem"
            />
            <LargeButton
              buttonText={t('export_protocol')}
              onClick={() => {
                if (hasWarning) {
                  setShowExportWarningModal(true)
                } else {
                  dispatch(loadFileActions.saveProtocolFile())
                }
              }}
              iconName="arrow-right"
              whiteSpace={NO_WRAP}
            />
          </Flex>
        </Flex>
        <Flex gridGap={SPACING.spacing80}>
          <Flex
            flex="1.27"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing40}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                <StyledText desktopStyle="headingSmallBold">
                  {t('protocol_metadata')}
                </StyledText>
                <Flex padding={SPACING.spacing4}>
                  <Btn
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    onClick={() => {
                      setShowEditMetadataModal(true)
                    }}
                    css={BUTTON_LINK_STYLE}
                    data-testid="ProtocolOverview_MetadataEditButton"
                  >
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t('edit')}
                    </StyledText>
                  </Btn>
                </Flex>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                {metaDataInfo.map(info => {
                  const [title, value] = Object.entries(info)[0]

                  return (
                    <ListItem type="noActive" key={`ProtocolOverview_${title}`}>
                      <ListItemDescriptor
                        type="default"
                        description={t(`${title}`)}
                        content={value ?? t('na')}
                      />
                    </ListItem>
                  )
                })}
                <ListItem type="noActive" key="ProtocolOverview_robotVersion">
                  <ListItemDescriptor
                    type="default"
                    description={t('required_app_version')}
                    content={t('app_version', {
                      version: REQUIRED_APP_VERSION,
                    })}
                  />
                </ListItem>
              </Flex>
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                <StyledText desktopStyle="headingSmallBold">
                  {t('instruments')}
                </StyledText>
                <Flex padding={SPACING.spacing4}>
                  <Btn
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    onClick={() => {
                      setShowEditInstrumentsModal(true)
                    }}
                    css={BUTTON_LINK_STYLE}
                  >
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t('edit')}
                    </StyledText>
                  </Btn>
                </Flex>
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
                            ?.displayName ?? t('na')
                        : t('na')
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
                            ?.displayName ?? t('na')
                        : t('na')
                    }
                  />
                </ListItem>
                {robotType === FLEX_ROBOT_TYPE ? (
                  <ListItem type="noActive" key={`ProtocolOverview_gripper`}>
                    <ListItemDescriptor
                      type="default"
                      description={t('extension')}
                      content={isGripperAttached ? t('gripper') : t('na')}
                    />
                  </ListItem>
                ) : null}
              </Flex>
            </Flex>
            <LiquidDefinitions
              allIngredientGroupFields={allIngredientGroupFields}
            />
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
              <Flex>
                <StyledText desktopStyle="headingSmallBold">
                  {t('step')}
                </StyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                {Object.keys(savedStepForms).length <= 1 ? (
                  <InfoScreen content={t('no_steps')} />
                ) : (
                  <ListItem type="noActive" key="ProtocolOverview_Step">
                    <ListItemDescriptor
                      type="default"
                      description={'Steps:'}
                      content={(
                        Object.keys(savedStepForms).length - 1
                      ).toString()}
                    />
                  </ListItem>
                )}
              </Flex>
            </Flex>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            flex="1"
            gridGap={SPACING.spacing12}
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <Flex gridGap="1.875rem" alignItems={ALIGN_CENTER}>
                <StyledText desktopStyle="headingSmallBold">
                  {t('starting_deck')}
                </StyledText>
                <Flex padding={SPACING.spacing4}>
                  <Btn
                    data-testid="Materials_list"
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    onClick={() => {
                      setShowMaterialsListModal(true)
                    }}
                    css={BUTTON_LINK_STYLE}
                  >
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t('materials_list')}
                    </StyledText>
                  </Btn>
                </Flex>
              </Flex>
              <ToggleGroup
                selectedValue={deckView}
                leftText={leftString}
                rightText={rightString}
                leftClick={() => {
                  setDeckView(leftString)
                }}
                rightClick={() => {
                  setDeckView(rightString)
                }}
              />
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
              {deckView === leftString ? (
                <DeckThumbnail hoverSlot={hover} setHoverSlot={setHover} />
              ) : (
                <OffDeckThumbnail hover={hover} setHover={setHover} />
              )}
              <SlotDetailsContainer
                robotType={robotType}
                slot={isOffDeckHover ? 'offDeck' : hover}
                offDeckLabwareId={isOffDeckHover ? hover : null}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Fragment>
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
