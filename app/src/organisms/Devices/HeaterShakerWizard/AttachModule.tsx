import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  Text,
  DIRECTION_ROW,
  Icon,
  TYPOGRAPHY,
  SPACING,
  Box,
  RobotWorkSpace,
  Module,
} from '@opentrons/components'
import {
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { StyledText } from '../../../atoms/text'
import attachHeaterShakerModule from '../../../assets/images/heater_shaker_module_diagram.svg'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import screwdriverOrientedLeft from '../../../assets/images/screwdriver_oriented_left.svg'
import { ProtocolModuleInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'
interface AttachModuleProps {
  moduleFromProtocol?: ProtocolModuleInfo
}

export function AttachModule(props: AttachModuleProps): JSX.Element {
  const { moduleFromProtocol } = props
  const { t } = useTranslation('heater_shaker')

  const moduleDef = getModuleDef2('heaterShakerModuleV1')
  const DECK_MAP_VIEWBOX = '-80 -20 550 460'
  const DECK_LAYER_BLOCKLIST = [
    'calibrationMarkings',
    'fixedBase',
    'doorStops',
    'metalFrame',
    'removalHandle',
    'removableDeckOutline',
    'screwHoles',
  ]

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText
        fontSize={TYPOGRAPHY.h2Regular}
        paddingBottom={SPACING.spacingL}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {t('step_1_of_4_attach_module')}
      </StyledText>
      <AttachedModuleItem step={t('1a')}>
        <Flex flexDirection={DIRECTION_ROW} marginLeft={SPACING.spacingXL}>
          <img src={attachHeaterShakerModule} alt="Attach Module to Deck" />
          <img src={screwdriverOrientedLeft} alt="screwdriver_1a" />
          <Flex
            marginLeft={SPACING.spacingXL}
            marginTop={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
          >
            <Trans
              t={t}
              i18nKey={'attach_module_anchor_not_extended'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
            <Trans
              t={t}
              i18nKey={'attach_module_turn_screws'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
                icon: <Icon name="counter-clockwise-arrow" size={'1.313rem'} />,
              }}
            />
          </Flex>
        </Flex>
      </AttachedModuleItem>
      <AttachedModuleItem step={t('1b')}>
        <Flex flexDirection={DIRECTION_ROW} marginX={SPACING.spacing4}>
          <Box
            width="60%"
            padding={SPACING.spacing3}
            data-testid={'HeaterShakerWizard_deckMap'}
          >
            {moduleFromProtocol != null ? (
              <RobotWorkSpace
                deckDef={standardDeckDef as any}
                viewBox={DECK_MAP_VIEWBOX}
                deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
                id={'HeaterShakerWizard_AttachModule_deckMap'}
                data-testid={`AttachModule_${moduleFromProtocol.moduleId}`}
              >
                {() => (
                  <React.Fragment
                    key={`AttachModule_${moduleFromProtocol.moduleId}`}
                  >
                    <Module
                      x={moduleFromProtocol.x}
                      y={moduleFromProtocol.y}
                      orientation={inferModuleOrientationFromXCoordinate(0)}
                      def={moduleDef}
                    />
                  </React.Fragment>
                )}
              </RobotWorkSpace>
            ) : (
              <RobotWorkSpace
                deckDef={standardDeckDef as any}
                viewBox={DECK_MAP_VIEWBOX}
                deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
                id={'HeaterShakerWizard_AttachModule_deckMap'}
                data-testid={`AttachModule_empty_deck`}
              />
            )}
          </Box>
          <img src={screwdriverOrientedLeft} alt="screwdriver_1b" />
          <Flex
            marginLeft={SPACING.spacing4}
            marginTop={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
          >
            <Trans
              t={t}
              i18nKey={'orient_heater_shaker_module'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
            <Trans
              t={t}
              i18nKey={
                moduleFromProtocol != null
                  ? 'place_the_module_slot_number'
                  : 'place_the_module_slot'
              }
              values={{ slot: moduleFromProtocol?.slotName }}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
            <Trans
              t={t}
              i18nKey={'attach_module_extend_anchors'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
                icon: <Icon name="clockwise-arrow" size={'1.313rem'} />,
              }}
            />
          </Flex>
        </Flex>
      </AttachedModuleItem>
      <AttachedModuleItem step={t('1c')}>
        <Text fontSize={TYPOGRAPHY.fontSizeH2}>
          {t('attach_module_check_attachment')}
        </Text>
      </AttachedModuleItem>
    </Flex>
  )
}

interface AttachedModuleItemProps {
  step: string
  children?: React.ReactNode
}

function AttachedModuleItem(props: AttachedModuleItemProps): JSX.Element {
  const { step } = props
  return (
    <Flex flexDirection={DIRECTION_ROW} marginTop={'0.625rem'}>
      <StyledText
        color={COLORS.darkGrey}
        paddingRight={SPACING.spacing4}
        data-testid={`attach_module_${step}`}
      >
        {step}
      </StyledText>
      <Flex
        border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        padding={`${SPACING.spacing4} ${SPACING.spacingM} ${SPACING.spacingM} ${SPACING.spacing4}`}
        width="100%"
        marginBottom={SPACING.spacing4}
      >
        {props.children}
      </Flex>
    </Flex>
  )
}
