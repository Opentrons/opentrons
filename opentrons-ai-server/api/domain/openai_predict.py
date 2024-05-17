from pathlib import Path
from typing import List, Tuple

from llama_index.core import Settings as li_settings
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI as liOpenAI
from llama_index.program.openai import OpenAIPydanticProgram
from openai import OpenAI
from openai.types.chat import ChatCompletion, ChatCompletionFunctionMessageParam, ChatCompletionMessage, ChatCompletionMessageParam
from pydantic import BaseModel

from api.domain.prompts import (
    example_pcr_1,
    execute_function_call,
    general_rules_1,
    pipette_type,
    rules_for_transfer,
    standard_labware_api,
    system_notes,
    tools,
)
from api.settings import Settings, is_running_on_lambda

ROOT_PATH: Path = Path(Path(__file__)).parent.parent.parent


class OpenAIPredict:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings
        self.client: OpenAI = OpenAI(api_key=settings.openai_api_key.get_secret_value())
        li_settings.embed_model = OpenAIEmbedding(
            model_name="text-embedding-3-large", api_key=self.settings.openai_api_key.get_secret_value()
        )

    def refine_characters(self, prompt: str) -> str:
        """
        Converts specific Greek characters in a string to their English phonetic equivalents and replaces
        certain special characters. The function is designed to handle text with Greek characters and
        special characters like backticks, converting them into more standardized or readable forms while
        preserving the structure and formatting of the original text.

        Parameters:
        - text (str): The input string containing Greek characters and possibly special characters.

        Returns:
        - str: The modified string with Greek characters replaced by their English phonetic equivalents
            and certain special characters like backticks replaced with single quotes.

        Example:
        >>> refine_characters("Transfer `10μ`")
        'Transfer '10m''
        """

        greek_to_english = {
            "α": "a",
            "β": "b",
            "γ": "g",
            "δ": "d",
            "ε": "e",
            "ζ": "z",
            "η": "e",
            "θ": "th",
            "ι": "i",
            "κ": "k",
            "λ": "l",
            "μ": "m",
            "ν": "n",
            "ξ": "x",
            "ο": "o",
            "π": "p",
            "ρ": "r",
            "σ": "s",
            "ς": "s",
            "τ": "t",
            "υ": "u",
            "φ": "ph",
            "χ": "ch",
            "ψ": "ps",
            "ω": "o",
            "Α": "A",
            "Β": "B",
            "Γ": "G",
            "Δ": "D",
            "Ε": "E",
            "Ζ": "Z",
            "Η": "E",
            "Θ": "Th",
            "Ι": "I",
            "Κ": "K",
            "Λ": "L",
            "Μ": "M",
            "Ν": "N",
            "Ξ": "X",
            "Ο": "O",
            "Π": "P",
            "Ρ": "R",
            "Σ": "S",
            "Τ": "T",
            "Υ": "U",
            "Φ": "Ph",
            "Χ": "Ch",
            "Ψ": "Ps",
            "Ω": "O",
        }
        translation_table = str.maketrans(greek_to_english)
        translated_text = prompt.translate(translation_table)
        return translated_text

    def get_docs_all(self, query: str) -> Tuple[str, str, str]:
        commands = self.extract_atomic_description(query)
        print(f"commands: {commands}")

        # define file paths for storage
        example_command_path = str(ROOT_PATH / "api" / "storage" / "index" / "commands")
        documentation_path = str(ROOT_PATH / "api" / "storage" / "index" / "v215")
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
        retriever = index.as_retriever(similarity_top_k=3)
        nodes = retriever.retrieve(query)
        docs = "\n".join(node.text.strip() for node in nodes)
        docs_v215 = f"\n{'='*15} DOCUMENTATION {'='*15}\n\n" + docs

        # standard api names
        standard_api_names = f"\n{'='*15} STANDARD API NAMES {'='*15}\n\n" + labware_api_path

        return example_commands, docs_v215, standard_api_names

    def extract_atomic_description(self, protocol_description: str) -> List[str]:
        class atomic_descr(BaseModel):
            """
            Model for atomic descriptions
            """

            desc: List[str]

        prompt_template_str = """\
                Below is a protocol description containing detailed information about the protocol:

                {protocol_description}

                Convert the protocol description to several atomic descriptions. \
                If statements are split by hyphen (-) or numbers (1), then each split can be considered\
                as a single atomic item. Get the statements fully.
                If they are not split or unclear, please decide yourself.
                If a protocol contains metadata and requirements, please ignore them.
                If nothing is provided, return blank.

                Example input:
                ```
                INTRO

                Metadata:
                - M-1
                - M-2
                - M-3

                Requirements:
                - R-1

                Modules
                - M-1

                Adapter
                - A-1

                Labware:
                - L-1
                - L-2
                - L-3

                Pipette mount:
                - P-1

                Well Allocation:
                - wa-11
                - wa-12

                Commands:
                1. C-1
                2. C-2
                ```

                Output:
                ```
                [INTRO, M-1, A-1, L-1, L-2, L-3, P-1, wa-11, wa-12, C-1, C-2]
                ```
                """

        program = OpenAIPydanticProgram.from_defaults(
            output_cls=atomic_descr, prompt_template_str=prompt_template_str, verbose=False, llm=liOpenAI(model="gpt-4-1106-preview")
        )
        details = program(protocol_description=protocol_description)
        descriptions = []
        print("=" * 50)
        for x in details.desc:
            if x not in ["Modules:", "Adapter:", "Labware:", "Pipette mount:", "Commands:", "Well Allocation:", "No modules"]:
                descriptions.append(x)
        return descriptions

    def refine_response(self, assitant_message: str) -> str:
        if assitant_message is None:
            return ""
        sys_msg: ChatCompletionMessageParam = {
            "role": "system",
            "content": f"{general_rules_1}\n Please leave useful comments for each command.",
        }

        user_message: ChatCompletionMessageParam = {"role": "user", "content": assitant_message}

        response = self.client.chat.completions.create(
            model=self.settings.OPENAI_MODEL_NAME,
            messages=[sys_msg, user_message],
            stream=False,
            temperature=0.005,
            max_tokens=4000,
            top_p=0.0,
            frequency_penalty=0,
            presence_penalty=0,
        )

        return response.choices[0].message.content if response.choices[0].message.content is not None else ""

    def predict(self, prompt: str, chat_completion_message_params: List[ChatCompletionMessageParam] | None = None) -> None | str:

        prompt = self.refine_characters(prompt)
        messages: List[ChatCompletionMessageParam] = [{"role": "system", "content": system_notes}]
        if chat_completion_message_params:
            messages += chat_completion_message_params

        example_commands, docs_v215, standard_api_names = self.get_docs_all(prompt)

        user_message: ChatCompletionMessageParam = {
            "role": "user",
            "content": f"QUESTION/DESCRIPTION: \n{prompt}\n\n"
            f"PYTHON API V2 DOCUMENTATION: \n{example_commands}\n"
            f"{pipette_type}\n{example_pcr_1}\n\n{docs_v215}\n\n"
            f"{rules_for_transfer}\n\n{standard_api_names}\n\n",
        }

        messages.append(user_message)

        response: ChatCompletion = self.client.chat.completions.create(
            model=self.settings.OPENAI_MODEL_NAME,
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
            print("Simulation is started.")
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
                    model=self.settings.OPENAI_MODEL_NAME,
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
    if is_running_on_lambda():
        return
    from rich import print
    from rich.prompt import Prompt

    settings = Settings.build()
    openai = OpenAIPredict(settings)
    prompt = Prompt.ask("Type a prompt to send to the OpenAI API:")
    completion = openai.predict(prompt)
    print(completion)


if __name__ == "__main__":
    main()
