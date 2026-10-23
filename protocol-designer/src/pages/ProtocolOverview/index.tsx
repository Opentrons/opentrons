import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  NO_WRAP,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { PeripheralsInfo } from '/protocol-designer/pages/ProtocolOverview/PeripheralsInfo'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import { COLUMN_STYLE } from '../../components/atoms'
import { EndUserAgreementFooter } from '../../components/molecules'
import {
  EditInstrumentsModal,
  EditProtocolMetadataModal,
} from '../../components/organisms'
import { MaterialsListModal } from '../../components/organisms/MaterialsListModal'
import { selectors as fileSelectors } from '../../file-data'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { actions as loadFileActions } from '../../load-file'
import { useProtocolExportHandler } from '../../resources/hooks'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getLiquidEntities,
} from '../../step-forms/selectors'
import { HardwareInfo } from './HardwareInfo'
import { InstrumentsInfo } from './InstrumentsInfo'
import { LiquidDefinitions } from './LiquidDefinitions'
import { ProtocolMetadata } from './ProtocolMetadata'
import { StartingDeck } from './StartingDeck'
import { StepsInfo } from './StepsInfo'

import type { ReactNode } from 'react'
import type { CreateCommand } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../types'

const DATE_ONLY_FORMAT = 'MMMM dd, yyyy'
const DATETIME_FORMAT = 'MMMM dd, yyyy | h:mm a'

export const LOAD_COMMANDS: Array<CreateCommand['commandType']> = [
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

export function ProtocolOverview(): ReactNode {
  const { t } = useTranslation([
    'protocol_overview',
    'alert',
    'shared',
    'starting_deck_State',
    'modules',
  ])
  const navigate = useNavigate()
  const [showEditInstrumentsModal, setShowEditInstrumentsModal] =
    useState<boolean>(false)
  const [showEditMetadataModal, setShowEditMetadataModal] =
    useState<boolean>(false)
  const formValues = useSelector(fileSelectors.getFileMetadata)
  const robotType = useSelector(fileSelectors.getRobotType)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const allIngredientGroupFields = useSelector(
    labwareIngredSelectors.allIngredientGroupFields
  )
  const { timeline } = useSelector(fileSelectors.getRobotStateTimeline)
  const hasCommands = timeline.length > 0

  const dispatch: ThunkDispatch<any> = useDispatch()
  const [showMaterialsListModal, setShowMaterialsListModal] =
    useState<boolean>(false)
  const savedStepForms = useSelector(stepFormSelectors.getSavedStepForms)
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const liquids = useSelector(getLiquidEntities)

  useEffect(
    () => {
      if (formValues?.created == null) {
        console.log(
          'formValues was possibly refreshed while on the overview page, redirecting to landing page'
        )
        navigate('/')
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formValues]
  )

  const {
    modules: modulesOnDeck,
    labware: labwaresOnDeck,
    additionalEquipmentOnDeck,
    pipettes,
  } = initialDeckSetup

  const { handleExportClick, exportWarningModalElement } =
    useProtocolExportHandler({
      hasCommands,
      onConfirmExport: () => {
        dispatch(loadFileActions.saveProtocolFile())
      },
    })

  const pipettesOnDeck = Object.values(pipettes)
  const { protocolName, description, created, lastModified, author } =
    formValues
  const metaDataInfo = [
    { title: 'description', value: description ?? null },
    { title: 'author', value: author ?? null },
    {
      title: 'created',
      value: created != null ? format(created, DATE_ONLY_FORMAT) : null,
    },
    {
      title: 'modified',
      value:
        lastModified != null ? format(lastModified, DATETIME_FORMAT) : null,
    },
  ]

  return (
    <>
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
      {exportWarningModalElement}
      {showMaterialsListModal ? (
        <MaterialsListModal
          hardware={Object.values(modulesOnDeck)}
          fixtures={
            robotType === OT2_ROBOT_TYPE
              ? Object.values(additionalEquipmentOnDeck)
              : []
          }
          labware={Object.values(labwaresOnDeck)}
          liquids={liquids}
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
              className={clsx(
                lineClampStyles.line_clamp,
                lineClampStyles.word_break_all
              )}
              style={{ WebkitLineClamp: 3 }}
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
              // ToDo (kk:2024/11/07 this will be updated in the future)
              css={css`
                border: 2px solid ${COLORS.blue50};
              `}
            />
            <LargeButton
              buttonText={t('export_protocol')}
              onClick={handleExportClick}
              iconName="arrow-right"
              whiteSpace={NO_WRAP}
              height="3.5rem"
            />
          </Flex>
        </Flex>
        <Flex gridGap={SPACING.spacing80} flexWrap={WRAP}>
          <Flex
            flex="1"
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
            <HardwareInfo
              robotType={robotType}
              modules={Object.values(modulesOnDeck)}
              additionalEquipment={additionalEquipmentOnDeck}
            />
            <PeripheralsInfo robotType={robotType} />
            <LiquidDefinitions
              allIngredientGroupFields={allIngredientGroupFields}
            />
            <StepsInfo savedStepForms={savedStepForms} />
          </Flex>
          <Flex
            flex="1"
            flexDirection={DIRECTION_COLUMN}
            css={COLUMN_STYLE}
            gridGap={SPACING.spacing12}
          >
            <StartingDeck
              robotType={robotType}
              setShowMaterialsListModal={setShowMaterialsListModal}
            />
          </Flex>
        </Flex>
      </Flex>
      <EndUserAgreementFooter />
    </>
  )
}
