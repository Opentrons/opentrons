import * as React from 'react'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  Link,
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Icon,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/buttons'
import { Toast } from '../../atoms/Toast'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { DropdownMenu } from '../../atoms/MenuList/DropdownMenu'
import { LabwareCard } from './LabwareCard'
import { AddCustomLabware } from './AddCustomLabware'
import { LabwareDetails } from './LabwareDetails'
import {
  LabwareDefAndDate,
  useAllLabware,
  useLabwareFailure,
  useNewLabwareName,
} from './hooks'

import type { DropdownOption } from '../../atoms/MenuList/DropdownMenu'
import type { LabwareFilter, LabwareSort } from './types'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create/'
const labwareDisplayCategoryFilters: LabwareFilter[] = [
  'all',
  'wellPlate',
  'tipRack',
  'tubeRack',
  'reservoir',
  'aluminumBlock',
]

const FILTER_OPTIONS: DropdownOption[] = []
labwareDisplayCategoryFilters.forEach(category =>
  FILTER_OPTIONS.push({ name: startCase(category), value: category })
)

const LINK_STYLES = css`
  opacity: 70%;
  &:hover {
    opacity: 100%;
  }
`

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')

  const [sortBy, setSortBy] = React.useState<LabwareSort>('alphabetical')
  const [showSortByMenu, setShowSortByMenu] = React.useState<boolean>(false)
  const toggleSetShowSortByMenu = (): void => setShowSortByMenu(!showSortByMenu)

  const [filterBy, setFilterBy] = React.useState<LabwareFilter>('all')

  const labware = useAllLabware(sortBy, filterBy)
  const { labwareFailureMessage, clearLabwareFailure } = useLabwareFailure()
  const { newLabwareName, clearLabwareName } = useNewLabwareName()
  const [showAddLabwareSlideout, setShowAddLabwareSlideout] = React.useState(
    false
  )
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [showFailureToast, setShowFailureToast] = React.useState(false)
  const [
    currentLabwareDef,
    setCurrentLabwareDef,
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
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing4}>
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
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_FLEX_END}
          paddingBottom={SPACING.spacing5}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
            <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('category')}
            </StyledText>
            <DropdownMenu
              filterOptions={FILTER_OPTIONS}
              currentOption={{ value: filterBy, name: startCase(filterBy) }}
              onClick={value => {
                setFilterBy(value as LabwareFilter)
              }}
            />
          </Flex>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            onClick={toggleSetShowSortByMenu}
          >
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              color={COLORS.darkGreyEnabled}
            >
              {t('sort_by')}
            </StyledText>
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.medGrey}
              borderRadius={BORDERS.radiusSoftCorners}
              marginLeft={SPACING.spacing3}
            >
              <StyledText
                css={TYPOGRAPHY.pSemiBold}
                paddingLeft={SPACING.spacing3}
                paddingRight={SPACING.spacing2}
                paddingY={SPACING.spacing2}
                data-testid="sortBy-label"
              >
                {sortBy === 'alphabetical' ? t('alphabetical') : t('reverse')}
              </StyledText>
              <Icon
                paddingRight={SPACING.spacing3}
                height={TYPOGRAPHY.lineHeight16}
                name={showSortByMenu ? 'chevron-up' : 'chevron-down'}
              />
            </Flex>
          </Flex>
          {showSortByMenu && (
            <Flex
              width="9.375rem"
              zIndex={2}
              borderRadius={BORDERS.radiusSoftCorners}
              boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
              position={POSITION_ABSOLUTE}
              backgroundColor={COLORS.white}
              top="8.5rem"
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
                setCurrentLabwareDef(labware)
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

          <Link
            external
            href={LABWARE_CREATOR_HREF}
            color={COLORS.darkBlack}
            css={LINK_STYLES}
            fontSize={TYPOGRAPHY.fontSizeLabel}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('open_labware_creator')}
            <Icon
              name="open-in-new"
              size="0.5rem"
              marginLeft={SPACING.spacing2}
            />
          </Link>
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
          onClose={() => setCurrentLabwareDef(null)}
        />
      )}
    </>
  )
}
