// ***********************************************************
// This file runs before every single spec file.
// We do this purely as a convenience mechanism so you don't have to import this file.
// https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Support-file
// ***********************************************************
import { join } from 'path'
import './commands'

export const navigateToUrl = (url: string): void => {
  cy.visit(url)
  cy.viewport('macbook-15')
}

export const wellBottomImageLocator: Record<string, string> = {
  flat: 'img[alt*="flat bottom"]',
  round: 'img[alt*="u shaped"]',
  v: 'img[alt*="v shaped"]',
}

interface FileHelperResult {
  downloadsFolder: string
  downloadFileStem: string
  downloadFilename: string
  downloadPath: string
  expectedExportFixture: string
}

export const fileHelper = (fileStem: string): FileHelperResult => {
  const downloadsFolder = Cypress.config('downloadsFolder')
  const downloadFileStem = fileStem
  const downloadFilename = `${downloadFileStem}.json`
  const downloadPath = join(downloadsFolder, downloadFilename)
  return {
    downloadsFolder,
    downloadFileStem,
    downloadFilename,
    downloadPath,
    expectedExportFixture: `../fixtures/${downloadFilename}`,
  }
}
