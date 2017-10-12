export const slotnames = [
  'A3', 'B3', 'C3', 'D3', 'E3',
  'A2', 'B2', 'C2', 'D2', 'E2',
  'A1', 'B1', 'C1', 'D1', 'E1'
]

// TODO wellShape not used yet
export const containerDims = {
  '96-flat': {rows: 12, columns: 8, wellShape: 'circle'},
  'tube-rack-2ml': {rows: 6, columns: 4, wellShape: 'circle'},
  'trough-12row': {rows: 12, columns: 1, wellShape: 'rectangle'},
  '384-plate': {rows: 24, columns: 16, wellShape: 'circle-small'}
}
