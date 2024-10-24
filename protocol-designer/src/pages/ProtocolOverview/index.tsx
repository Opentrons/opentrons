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
  EndUserAgreementFooter,
  Flex,
  JUSTIFY_END,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  Modal,
  NO_WRAP,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  ToggleGroup,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

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
import { BUTTON_LINK_STYLE, LINE_CLAMP_TEXT_STYLE } from '../../atoms'
import { getMainPagePortalEl } from '../../components/portals/MainPageModalPortal'
import {
  EditProtocolMetadataModal,
  EditInstrumentsModal,
  SlotDetailsContainer,
} from '../../organisms'
import { DeckThumbnail } from './DeckThumbnail'
import { OffDeckThumbnail } from './OffdeckThumbnail'
import { getWarningContent } from './UnusedModalContent'
import { ProtocolMetadata } from './ProtocolMetadata'
import { InstrumentsInfo } from './InstrumentsInfo'
import { LiquidDefinitions } from './LiquidDefinitions'
import { StepsInfo } from './StepsInfo'

import type { CreateCommand } from '@opentrons/shared-data'
import type { DeckSlot } from '@opentrons/step-generation'
import type { ThunkDispatch } from '../../types'

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

  const warning = hasWarning
    ? getWarningContent({
        noCommands,
        pipettesWithoutStep,
        modulesWithoutStep,
        gripperWithoutStep,
        fixtureWithoutStep,
        t,
      })
    : null

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
            titleElement1={warning?.titleElement}
            childrenPadding={SPACING.spacing24}
            footer={
              <Flex
                justifyContent={JUSTIFY_END}
                gridGap={SPACING.spacing8}
                padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
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
              css={LINE_CLAMP_TEXT_STYLE(3)}
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
        <Flex gridGap={SPACING.spacing80} flexWrap={WRAP}>
          <Flex
            flex="1.27"
            flexDirection={DIRECTION_COLUMN}
            css={COLUMN_STYLE}
            gridGap={SPACING.spacing40}
          >
            <ProtocolMetadata
              metaDataInfo={metaDataInfo}
              setShowEditMetadataModal={setShowEditMetadataModal}
            />
            <InstrumentsInfo
              robotType={robotType}
              pipettesOnDeck={pipettesOnDeck}
              additionalEquipment={additionalEquipment}
              setShowEditInstrumentsModal={setShowEditInstrumentsModal}
            />
            <LiquidDefinitions
              allIngredientGroupFields={allIngredientGroupFields}
            />
            <StepsInfo savedStepForms={savedStepForms} />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            css={COLUMN_STYLE}
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
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing32}
              alignItems={ALIGN_CENTER}
            >
              {deckView === leftString ? (
                <DeckThumbnail hoverSlot={hover} setHoverSlot={setHover} />
              ) : (
                <OffDeckThumbnail
                  hover={hover}
                  setHover={setHover}
                  width="100%"
                />
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
      <EndUserAgreementFooter />
    </Fragment>
  )
}

const MIN_OVERVIEW_WIDTH = '64rem'
const COLUMN_GRID_GAP = '5rem'
const COLUMN_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  min-width: calc((${MIN_OVERVIEW_WIDTH} - ${COLUMN_GRID_GAP}) * 0.5);
  flex: 1;
`
