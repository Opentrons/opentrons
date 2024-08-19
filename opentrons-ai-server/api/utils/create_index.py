import os
import os.path
from pathlib import Path
from typing import Any, Union

from llama_index.core import Settings as llamasettings
from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex, load_index_from_storage
from llama_index.core.indices.base import BaseIndex
from llama_index.embeddings.openai import OpenAIEmbedding

ROOT_PATH: Path = Path(Path(__file__)).parent.parent.parent
llamasettings.embed_model = OpenAIEmbedding(model_name="text-embedding-3-large", api_key=os.environ["OPENAI_API_KEY"])


def create_index(data_path: str, data_file: str, index_name: str) -> Union[BaseIndex[Any], VectorStoreIndex]:
    """
    # creating index using llama-index
    data_path = str(ROOT_PATH / "api" / "data")
    data_docs = str(ROOT_PATH / "api" / "data" / "python_api_219_docs.md")
    file_name = "v219_ref"
    index = create_index(data_path, data_docs, file_name)

    # if one wants to check with a prompt
    query_engine: Any = index.as_query_engine()
    prompt = input()
    response = query_engine.query(prompt)
    print(response)

    Settings
    - os.environ["OPENAI_API_KEY"]

    """

    # check if storage already exists
    PERSIST_DIR = str(ROOT_PATH / "api" / "storage" / "index" / index_name)
    if not os.path.exists(PERSIST_DIR):
        # load the documents and create the index
        documents = SimpleDirectoryReader(data_path, [data_file]).load_data()
        index = VectorStoreIndex.from_documents(documents)
        # store it for later
        index.storage_context.persist(persist_dir=PERSIST_DIR)
        return index
    else:
        # load the existing index
        print("Using existing nidex.")
        storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
        return load_index_from_storage(storage_context)
