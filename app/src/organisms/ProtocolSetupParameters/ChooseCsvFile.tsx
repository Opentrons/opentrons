import * as React from 'react'
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
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'

import { RadioButton } from '../../atoms/buttons'
import { getShellUpdateDataFiles } from '../../redux/shell'
import { ChildNavigation } from '../ChildNavigation'
import { EmptyFile } from './EmptyFile'

import type {
  CsvFileParameter,
  CsvFileParameterFileData,
} from '@opentrons/shared-data'
import type { CsvFileData } from '@opentrons/api-client'

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
  const csvFilesOnRobot = useAllCsvFilesQuery(protocolId).data?.data.files ?? []
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
  ] = React.useState<CsvFileParameterFileData>(initialFileObject)

  const handleBackButton = (): void => {
    if (!isEqual(csvFileSelected, initialFileObject)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setParameter(csvFileSelected, parameter.variableName)
    }
    handleGoBack()
  }

  React.useEffect(() => {
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
                  <RadioButton
                    key={csv.id}
                    data-testid={csv.id}
                    buttonLabel={csv.name}
                    buttonValue={`${csv.id}`}
                    onChange={() => {
                      setCsvFileSelected({ id: csv.id, fileName: csv.name })
                    }}
                    isSelected={csvFileSelected?.id === csv.id}
                  />
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
                    <React.Fragment key={fileName}>
                      {csvFilePath.length !== 0 && fileName !== undefined ? (
                        <RadioButton
                          data-testid={fileName}
                          buttonLabel={fileName ?? 'default'}
                          buttonValue={csvFilePath}
                          onChange={() => {
                            setCsvFileSelected({
                              filePath: csvFilePath,
                              fileName,
                            })
                          }}
                          isSelected={csvFileSelected?.filePath === csvFilePath}
                        />
                      ) : null}
                    </React.Fragment>
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
  flex: 1;
`

const LIST_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
`
