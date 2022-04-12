import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Link,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Icon,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/Buttons'
import { Toast } from '../../atoms/Toast'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { LabwareCard } from './LabwareCard'
import { AddCustomLabware } from './AddCustomLabware'
import { LabwareDetails } from './LabwareDetails'
import {
  LabwareDefAndDate,
  useGetAllLabware,
  useLabwareFailure,
  useNewLabwareName,
} from './hooks'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create/'

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')

  const [sortBy, setSortBy] = React.useState<'alphabetical' | 'reverse'>(
    'alphabetical'
  )
  const [showSortByMenu, setShowSortByMenu] = React.useState<boolean>(false)
  const toggleSetShowSortByMenu = (): void => setShowSortByMenu(!showSortByMenu)

  const labware = useGetAllLabware(sortBy)
  const { labwareFailureMessage, clearLabwareFailure } = useLabwareFailure()
  const { newLabwareName, clearLabwareName } = useNewLabwareName()
  const [showAddLabwareSlideout, setShowAddLabwareSlideout] = React.useState(
    false
  )
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showFailureToast, setShowFailureToast] = React.useState(false)
  const [
    currentLabwareDef,
    setCurrentLabwaredef,
  ] = React.useState<null | LabwareDefAndDate>(null)

  React.useEffect(() => {
    if (labwareFailureMessage != null) {
      setShowAddLabwareSlideout(false)
      setShowFailureToast(true)
    } else if (newLabwareName != null) {
      setShowAddLabwareSlideout(false)
      setShowSuccessToast(true)
    }
  }, [labwareFailureMessage, newLabwareName])

  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          paddingBottom={SPACING.spacing5}
        >
          <StyledText
            as="h1"
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('labware')}
          </StyledText>
          <SecondaryButton onClick={() => setShowAddLabwareSlideout(true)}>
            {t('import')}
          </SecondaryButton>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={ALIGN_CENTER}
          paddingBottom={SPACING.spacing5}
        >
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            onClick={() => toggleSetShowSortByMenu()}
          >
            <StyledText css={TYPOGRAPHY.pSemiBold}>{t('sort_by')} </StyledText>
            <Icon
              height={TYPOGRAPHY.lineHeight16}
              name={showSortByMenu ? 'chevron-up' : 'chevron-down'}
            />
          </Flex>
          {showSortByMenu && (
            <Flex
              width="9rem"
              zIndex={10}
              borderRadius={'4px 4px 0px 0px'}
              boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
              position={POSITION_ABSOLUTE}
              backgroundColor={COLORS.white}
              top="6.5rem"
              right={0}
              flexDirection={DIRECTION_COLUMN}
            >
              <MenuItem
                onClick={() => {
                  setSortBy('alphabetical')
                  setShowSortByMenu(false)
                }}
              >
                {t('alphabetical')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortBy('reverse')
                  setShowSortByMenu(false)
                }}
              >
                {t('reverse')}
              </MenuItem>
            </Flex>
          )}
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
          {labware.map((labware, index) => (
            <LabwareCard
              key={`${labware.definition.metadata.displayName}${index}`}
              labware={labware}
              onClick={() => {
                setCurrentLabwaredef(labware)
              }}
            />
          ))}
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing3}
          alignItems={ALIGN_CENTER}
          marginTop={SPACING.spacing6}
        >
          <StyledText
            as="p"
            color={COLORS.black}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('create_new_def')}
          </StyledText>
          <StyledText
            css={TYPOGRAPHY.h6SemiBold}
            color={COLORS.darkGreyEnabled}
          >
            <Link
              href={LABWARE_CREATOR_HREF}
              color={COLORS.darkGreyEnabled}
              external
            >
              {t('open_labware_creator')}{' '}
              <Icon name="open-in-new" height="10px"></Icon>
            </Link>
          </StyledText>
        </Flex>
      </Box>
      {showAddLabwareSlideout && (
        <AddCustomLabware
          isExpanded={showAddLabwareSlideout}
          onCloseClick={() => setShowAddLabwareSlideout(false)}
          onSuccess={() => setShowSuccessToast(true)}
          onFailure={() => setShowFailureToast(true)}
        />
      )}
      {showSuccessToast && newLabwareName != null && (
        <Toast
          message={t('imported', { filename: newLabwareName })}
          type="success"
          data-testid="LabwareIndex_successToast"
          closeButton
          onClose={() => {
            setShowSuccessToast(false)
            clearLabwareName()
          }}
        />
      )}
      {showFailureToast && labwareFailureMessage != null && (
        <Toast
          message={labwareFailureMessage}
          type="error"
          data-testid="LabwareIndex_errorToast"
          closeButton
          onClose={() => {
            setShowFailureToast(false)
            clearLabwareFailure()
          }}
        />
      )}
      {currentLabwareDef != null && (
        <LabwareDetails
          labware={currentLabwareDef}
          onClose={() => setCurrentLabwaredef(null)}
        />
      )}
    </>
  )
}
