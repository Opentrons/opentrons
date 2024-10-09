import { useState, useEffect, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import isEqual from 'lodash/isEqual'
import last from 'lodash/last'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
  RadioButton,
  truncateString,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'

import { getShellUpdateDataFiles } from '/app/redux/shell'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { EmptyFile } from './EmptyFile'

import type {
  CsvFileParameter,
  CsvFileParameterFileData,
} from '@opentrons/shared-data'
import type { CsvFileData } from '@opentrons/api-client'

const MAX_CHARS = 52
const CSV_FILENAME_BREAK_POINT = 42
interface ChooseCsvFileProps {
  protocolId: string
  handleGoBack: () => void
  parameter: CsvFileParameter
  setParameter: (
    value: boolean | string | number | CsvFileParameterFileData,
    variableName: string
  ) => void
}

export function ChooseCsvFile({
  protocolId,
  handleGoBack,
  parameter,
  setParameter,
}: ChooseCsvFileProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  const csvFilesOnUSB = useSelector(getShellUpdateDataFiles) ?? []
  const csvFilesOnRobot = (useAllCsvFilesQuery(protocolId).data?.data ??
    []) as CsvFileData[]
  const sortedCsvFilesOnUSB = csvFilesOnUSB.sort((a, b) => {
    const regex = /^(.*\/)?(.+?)(\d*)\.csv$/
    const aMatch = a.match(regex)
    const bMatch = b.match(regex)

    if (!aMatch || !bMatch) {
      console.error('Invalid filename format:', !aMatch ? a : b)
      return 0
    }

    const [, , aText, aNum] = aMatch
    const [, , bText, bNum] = bMatch

    if (aText !== bText) {
      return aText.localeCompare(bText)
    }

    return (
      (aNum === '' ? 0 : parseInt(aNum, 10)) -
      (bNum === '' ? 0 : parseInt(bNum, 10))
    )
  })

  const initialFileObject: CsvFileParameterFileData = parameter.file ?? {}
  const [
    csvFileSelected,
    setCsvFileSelected,
  ] = useState<CsvFileParameterFileData>(initialFileObject)

  const handleBackButton = (): void => {
    if (!isEqual(csvFileSelected, initialFileObject)) {
      setParameter(csvFileSelected, parameter.variableName as string)
    }
    handleGoBack()
  }

  useEffect(() => {
    if (csvFilesOnUSB.length === 0) {
      setCsvFileSelected({})
    }
  }, [csvFilesOnUSB])

  return (
    <>
      <ChildNavigation
        header={t('choose_csv_file')}
        onClickBack={handleBackButton}
        inlineNotification={{
          type: 'neutral',
          heading: t('usb_drive_notification'),
        }}
      />
      <Flex
        marginTop="7.75rem"
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        paddingBottom={SPACING.spacing40}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing48}>
          <Flex css={CONTAINER_STYLE}>
            <LegacyStyledText css={HEADER_TEXT_STYLE}>
              {t('csv_files_on_robot')}
            </LegacyStyledText>
            <Flex css={LIST_CONTAINER_STYLE}>
              {csvFilesOnRobot.length !== 0 ? (
                csvFilesOnRobot.map((csv: CsvFileData) => (
                  <Fragment key={csv.id}>
                    <RadioButton
                      buttonLabel={truncateString(
                        csv.name,
                        MAX_CHARS,
                        CSV_FILENAME_BREAK_POINT
                      )}
                      buttonValue={csv.id}
                      onChange={() => {
                        setCsvFileSelected({ id: csv.id, fileName: csv.name })
                      }}
                      id={`${csv.id}-on-robot`}
                      isSelected={csvFileSelected?.id === csv.id}
                      maxLines={3}
                    />
                  </Fragment>
                ))
              ) : (
                <EmptyFile />
              )}
            </Flex>
          </Flex>
          <Flex css={CONTAINER_STYLE}>
            <LegacyStyledText css={HEADER_TEXT_STYLE}>
              {t('csv_files_on_usb')}
            </LegacyStyledText>
            <Flex css={LIST_CONTAINER_STYLE}>
              {sortedCsvFilesOnUSB.length !== 0 ? (
                sortedCsvFilesOnUSB.map(csvFilePath => {
                  const fileName = last(csvFilePath.split('/'))
                  return (
                    <Fragment key={fileName}>
                      {csvFilePath.length !== 0 && fileName !== undefined ? (
                        <RadioButton
                          buttonLabel={truncateString(
                            fileName,
                            MAX_CHARS,
                            CSV_FILENAME_BREAK_POINT
                          )}
                          buttonValue={csvFilePath}
                          onChange={() => {
                            setCsvFileSelected({
                              filePath: csvFilePath,
                              fileName,
                            })
                          }}
                          id={`${csvFilePath.replace('/', '-')}}-on-usb`}
                          isSelected={csvFileSelected?.filePath === csvFilePath}
                          maxLines={3}
                        />
                      ) : null}
                    </Fragment>
                  )
                })
              ) : (
                <EmptyFile />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

const HEADER_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  width: 28rem;
`

const LIST_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
`
