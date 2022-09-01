export type Direction = 'attach' | 'detach'

export type WizardStep =
  | 'clearDeck'
  | 'instructions'
  | 'confirm'
  | 'calibratePipette'
//  TODO(JR, 08.31.22): remove `calibratePipette` from WizardStep when we remove FF

export type Diagram = 'screws' | 'tab'
