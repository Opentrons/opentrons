import { format } from 'date-fns'

export const formatRecordDate = (isoString: string): string =>
  format(new Date(isoString), 'M/d/yyyy HH:mm:ss')
