// @flow
import type {ProtocolFile} from '../../file-types'
import type {FileMetadataFields} from '../../file-data'

const fileMetadata = (file: ProtocolFile): FileMetadataFields => {
  const {metadata} = file
  return {
    author: metadata.author,
    description: metadata.description,
    name: metadata['protocol-name']
  }
}

const allReducers = {
  unsavedMetadataForm: fileMetadata, // use matching fields
  fileMetadata
}

export default allReducers
