import path from 'path'

import { isEnumValue } from './utils'

// ////////////////////////////////////////////
// This is the data section where we map all the protocol files
// This allows for IDE . completion and type checking
// ////////////////////////////////////////////

export enum TestFilePath {
  // Define the path relative to the protocol-designer directory
  // PD root project fixtures
  DoItAllV3MigratedToV6 = 'fixtures/protocol/6/doItAllV3MigratedToV6.json',
  Mix_6_0_0 = 'fixtures/protocol/6/mix_6_0_0.json',
  PreFlexGrandfatheredProtocolV6 = 'fixtures/protocol/6/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
  DoItAllV4MigratedToV6 = 'fixtures/protocol/6/doItAllV4MigratedToV6.json',
  Example_1_1_0V6 = 'fixtures/protocol/6/example_1_1_0MigratedFromV1_0_0.json',
  DoItAllV3MigratedToV7 = 'fixtures/protocol/7/doItAllV3MigratedToV7.json',
  Mix_7_0_0 = 'fixtures/protocol/7/mix_7_0_0.json',
  DoItAllV7 = 'fixtures/protocol/7/doItAllV7.json',
  DoItAllV4MigratedToV7 = 'fixtures/protocol/7/doItAllV4MigratedToV7.json',
  Example_1_1_0V7 = 'fixtures/protocol/7/example_1_1_0MigratedFromV1_0_0.json',
  MinimalProtocolOldTransfer = 'fixtures/protocol/1/minimalProtocolOldTransfer.json',
  Example_1_1_0 = 'fixtures/protocol/1/example_1_1_0.json',
  PreFlexGrandfatheredProtocolV1 = 'fixtures/protocol/1/preFlexGrandfatheredProtocol.json',
  DoItAllV1 = 'fixtures/protocol/1/doItAll.json',
  PreFlexGrandfatheredProtocolV4 = 'fixtures/protocol/4/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
  DoItAllV3V4 = 'fixtures/protocol/4/doItAllV3.json',
  DoItAllV4V4 = 'fixtures/protocol/4/doItAllV4.json',
  NinetySixChannelFullAndColumn = 'fixtures/protocol/8/ninetySixChannelFullAndColumn.json',
  NewAdvancedSettingsAndMultiTemp = 'fixtures/protocol/8/newAdvancedSettingsAndMultiTemp.json',
  Example_1_1_0V8 = 'fixtures/protocol/8/example_1_1_0MigratedToV8.json',
  DoItAllV4MigratedToV8 = 'fixtures/protocol/8/doItAllV4MigratedToV8.json',
  DoItAllV8 = 'fixtures/protocol/8/doItAllV8.json',
  DoItAllV3MigratedToV8 = 'fixtures/protocol/8/doItAllV3MigratedToV8.json',
  Mix_8_0_0 = 'fixtures/protocol/8/mix_8_0_0.json',
  DoItAllV7MigratedToV8 = 'fixtures/protocol/8/doItAllV7MigratedToV8.json',
  MixSettingsV5 = 'fixtures/protocol/5/mixSettings.json',
  DoItAllV5 = 'fixtures/protocol/5/doItAllV5.json',
  BatchEditV5 = 'fixtures/protocol/5/batchEdit.json',
  MultipleLiquidsV5 = 'fixtures/protocol/5/multipleLiquids.json',
  PreFlexGrandfatheredProtocolV5 = 'fixtures/protocol/5/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
  DoItAllV3V5 = 'fixtures/protocol/5/doItAllV3.json',
  TransferSettingsV5 = 'fixtures/protocol/5/transferSettings.json',
  Mix_5_0_X = 'fixtures/protocol/5/mix_5_0_x.json',
  Example_1_1_0V5 = 'fixtures/protocol/5/example_1_1_0MigratedFromV1_0_0.json',
  ThermocyclerOnOt2V7 = 'fixtures/protocol/7/thermocyclerOnOt2V7.json',
  ThermocyclerOnOt2V7MigratedToV8 = 'fixtures/protocol/8/thermocyclerOnOt2V7MigratedToV8.json',
  // cypress fixtures
  GarbageTextFile = 'cypress/fixtures/garbage.txt',
  Generic96TipRack200ul = 'cypress/fixtures/generic_96_tiprack_200ul.json',
  InvalidLabware = 'cypress/fixtures/invalid_labware.json',
  InvalidTipRack = 'cypress/fixtures/invalid_tip_rack.json',
  InvalidTipRackTxt = 'cypress/fixtures/invalid_tip_rack.txt',
  InvalidJson = 'cypress/fixtures/invalid_json.txt', // a file with invalid JSON may not have .json extension because cy.readfile will not read it.
}

export enum ExportTestFilePath {
  // python export protocols
  ThreePlateWater = 'fixtures/protocol/9/3 Plate Water (1) (1).json',
  ProteaseAssay = 'fixtures/protocol/9/3Cl Protease Assay _fill reaction tubes, add substrate and timepoints_50ul react tube (4) (1).json',
  Well_96_Plating = 'fixtures/protocol/9/96 well (24 targets) plating with multichannel - 1 plate.json',
  PCR_Step2_Alex = 'fixtures/protocol/9/220113_PCR_step2_Alex.json',
  Rounds_1_to_4 = 'fixtures/protocol/9/20231031 Rounds 1 to 4 (N45 libraries) (Three streams) (uncleaved first)(large volumes).json',
  AddWaterToDeepWellPlates = 'fixtures/protocol/9/Add water to 8X96 deep well plates (125ul) Minimal reproduceable_mod.json',
  AlbuminElisa = 'fixtures/protocol/9/Albumin Elisa P1 V2.3 step 3.json',
  AlmodLab = 'fixtures/protocol/9/AlmodLab - LbL 24 wells Plate_V2.json',
  BeadCleanFixed = 'fixtures/protocol/9/Bead clean fixed_.json',
  EasyPepDigestion = 'fixtures/protocol/9/Easy Pep Digestion (2sx) - tested (1).json',
  Example_Protocol_6_0_1 = 'fixtures/protocol/9/Example_Protocol_6_0_1.json',
  IlluminaDNAPrep48 = 'fixtures/protocol/9/Illumina DNA Prep 48x v8 Works!.json',
  Luis_Test = 'fixtures/protocol/9/Luis - test (1).json',
  MS_Prep_112Samples = 'fixtures/protocol/9/MS_Prep_112samples_270622.json',
  Nanite_Test = 'fixtures/protocol/9/Nanite_Test.json',
  qPCR_Cas9 = 'fixtures/protocol/9/qPCR Cas9 Activity Check v3.json',
  Setup_For_Test = 'fixtures/protocol/9/setup for test 1.json',
  Susceptibility = 'fixtures/protocol/9/Susceptibility (4).json',
  Test_5 = 'fixtures/protocol/9/Test  (5).json',
}

export interface TestFile {
  path: string
  downloadsFolder: string
  basename: string
}

export const getTestFile = (id: TestFilePath): TestFile => {
  if (!isEnumValue([TestFilePath], [id])) {
    throw new Error(`Invalid file path: ${id as string}`)
  }

  return {
    path: id.valueOf(),
    basename: path.basename(id.valueOf()),
    downloadsFolder: Cypress.config('downloadsFolder'),
  }
}

export const getExportTestFile = (id: ExportTestFilePath): TestFile => {
  if (!isEnumValue([ExportTestFilePath], [id])) {
    throw new Error(`Invalid file path: ${id as string}`)
  }

  return {
    path: id.valueOf(),
    basename: path.basename(id.valueOf()),
    downloadsFolder: Cypress.config('downloadsFolder'),
  }
}
