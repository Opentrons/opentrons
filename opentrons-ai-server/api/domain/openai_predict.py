from pathlib import Path
from typing import List, Tuple

import structlog
from ddtrace import tracer
from llama_index.core import Settings as li_settings
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI as li_OpenAI
from llama_index.program.openai import OpenAIPydanticProgram
from openai import OpenAI
from openai.types.chat import ChatCompletion, ChatCompletionFunctionMessageParam, ChatCompletionMessage, ChatCompletionMessageParam
from pydantic import BaseModel

from api.domain.prompts import (
    example_pcr_1,
    execute_function_call,
    general_rules_1,
    pipette_type,
    prompt_template_str,
    rules_for_transfer,
    standard_labware_api,
    system_notes,
    tools,
)
from api.domain.utils import refine_characters
from api.settings import Settings

settings: Settings = Settings()
logger = structlog.stdlib.get_logger(settings.logger_name)
ROOT_PATH: Path = Path(Path(__file__)).parent.parent.parent


class OpenAIPredict:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings
        self.client: OpenAI = OpenAI(api_key=settings.openai_api_key.get_secret_value())
        li_settings.embed_model = OpenAIEmbedding(
            model_name="text-embedding-3-large", api_key=self.settings.openai_api_key.get_secret_value()
        )

    @tracer.wrap()
    def get_docs_all(self, query: str) -> Tuple[str, str, str]:
        commands = self.extract_atomic_description(query)
        logger.info("Commands", extra={"commands": commands})

        # define file paths for storage
        example_command_path = str(ROOT_PATH / "api" / "storage" / "index" / "commands")
        documentation_path = str(ROOT_PATH / "api" / "storage" / "index" / "v219")
        documentation_ref_path = str(ROOT_PATH / "api" / "storage" / "index" / "v219_ref")

        labware_api_path = standard_labware_api

        # retrieve example commands
        example_commands = f"\n\n{'='*15} EXAMPLE COMMANDS {'='*15}\n"
        storage_context = StorageContext.from_defaults(persist_dir=example_command_path)
        index = load_index_from_storage(storage_context)
        retriever = index.as_retriever(similarity_top_k=1)
        content_all = ""
        if isinstance(commands, list):
            for command in commands:
                nodes = retriever.retrieve(command)
                content = "\n".join(node.text for node in nodes)
                content_all += f">>>> >>>> \n\\{content}n"
            example_commands += content_all
        else:
            example_commands = []

        # retrieve documentation
        storage_context = StorageContext.from_defaults(persist_dir=documentation_path)
        index = load_index_from_storage(storage_context)
        retriever = index.as_retriever(similarity_top_k=2)
        nodes = retriever.retrieve(query)
        docs = "\n".join(node.text.strip() for node in nodes)
        docs = f"\n{'='*15} DOCUMENTATION {'='*15}\n\n" + docs

        # retrieve reference
        storage_context = StorageContext.from_defaults(persist_dir=documentation_ref_path)
        index = load_index_from_storage(storage_context)
        retriever = index.as_retriever(similarity_top_k=2)
        nodes = retriever.retrieve(query)
        docs_ref = "\n".join(node.text.strip() for node in nodes)
        docs_ref = f"\n{'='*15} DOCUMENTATION REFERENCE {'='*15}\n\n" + docs_ref

        # standard api names
        standard_api_names = f"\n{'='*15} STANDARD API NAMES {'='*15}\n\n" + labware_api_path

        return example_commands, docs + docs_ref, standard_api_names

    @tracer.wrap()
    def extract_atomic_description(self, protocol_description: str) -> List[str]:
        class atomic_descr(BaseModel):
            """
            Model for atomic descriptions
            """

            desc: List[str]

        program = OpenAIPydanticProgram.from_defaults(
            output_cls=atomic_descr,
            prompt_template_str=prompt_template_str,
            verbose=False,
            llm=li_OpenAI(model=self.settings.openai_model_name, api_key=self.settings.openai_api_key.get_secret_value()),
        )
        details = program(protocol_description=protocol_description)
        descriptions = []
        for x in details.desc:
            if x not in ["Modules:", "Adapter:", "Labware:", "Pipette mount:", "Commands:", "Well Allocation:", "No modules"]:
                descriptions.append(x)
        return descriptions

    @tracer.wrap()
    def refine_response(self, assistant_message: str) -> str:
        if assistant_message is None:
            return ""
        system_message: ChatCompletionMessageParam = {
            "role": "system",
            "content": f"{general_rules_1}\n Please leave useful comments for each command.",
        }

        user_message: ChatCompletionMessageParam = {"role": "user", "content": assistant_message}

        response = self.client.chat.completions.create(
            model=self.settings.openai_model_name,
            messages=[system_message, user_message],
            stream=False,
            temperature=0.005,
            max_tokens=4000,
            top_p=0.0,
            frequency_penalty=0,
            presence_penalty=0,
        )

        return response.choices[0].message.content if response.choices[0].message.content is not None else ""

    @tracer.wrap()
    def predict(self, prompt: str, chat_completion_message_params: List[ChatCompletionMessageParam] | None = None) -> None | str:

        prompt = refine_characters(prompt)
        messages: List[ChatCompletionMessageParam] = [{"role": "system", "content": system_notes}]
        if chat_completion_message_params:
            messages += chat_completion_message_params

        example_commands, docs_refs, standard_api_names = self.get_docs_all(prompt)

        user_message: ChatCompletionMessageParam = {
            "role": "user",
            "content": f"QUESTION/DESCRIPTION: \n{prompt}\n\n"
            f"PYTHON API V2 DOCUMENTATION: \n{example_commands}\n"
            f"{pipette_type}\n{example_pcr_1}\n\n{docs_refs}\n\n"
            f"{rules_for_transfer}\n\n{standard_api_names}\n\n",
        }

        messages.append(user_message)

        response: ChatCompletion = self.client.chat.completions.create(
            model=self.settings.openai_model_name,
            messages=messages,
            stream=False,
            temperature=0.005,
            max_tokens=4000,
            top_p=0.0,
            frequency_penalty=0,
            presence_penalty=0,
            tools=tools,
            tool_choice="auto",
        )

        assistant_message: ChatCompletionMessage = response.choices[0].message
        if assistant_message.content is None:
            assistant_message.content = ""
        assistant_message.content = str(self.refine_response(assistant_message.content))

        if assistant_message.tool_calls and assistant_message.tool_calls[0]:
            logger.info("Simulation has started")
            if assistant_message.tool_calls[0]:
                assistant_message.content = str(assistant_message.tool_calls[0].function)
                messages.append({"role": assistant_message.role, "content": assistant_message.content})
                tool_call = assistant_message.tool_calls[0]
                function_response = execute_function_call(tool_call.function.name, tool_call.function.arguments)

                # append tool call response to messages
                messages.append(
                    ChatCompletionFunctionMessageParam(role="function", name=tool_call.function.name, content=str(function_response))
                )
                response2: ChatCompletion = self.client.chat.completions.create(
                    model=self.settings.openai_model_name,
                    messages=messages,
                    stream=False,
                    temperature=0,
                    max_tokens=4000,
                    top_p=0.0,
                    frequency_penalty=0,
                    presence_penalty=0,
                )
                final_response = response2.choices[0].message.content
                return final_response
        return assistant_message.content


def main() -> None:
    """Intended for testing this class locally."""
    from rich import print
    from rich.prompt import Prompt

    settings = Settings()
    openai = OpenAIPredict(settings)
    prompt = Prompt.ask("Type a prompt to send to the OpenAI API:")
    completion = openai.predict(prompt)
    print(completion)


if __name__ == "__main__":
    main()
