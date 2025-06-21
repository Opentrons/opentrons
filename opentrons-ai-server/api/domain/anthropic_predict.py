import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Literal, cast

import requests
import structlog
import weave  # type: ignore
from anthropic import Anthropic
from anthropic.types import Message, MessageParam, TextBlockParam
from ddtrace import tracer

from api.domain.config_anthropic import DOCUMENTS, PROMPT, PROMPT_FIND_RELEVANT_DOCS, SYSTEM_PROMPT
from api.domain.config_pd import DOCUMENTS_PD, PROMPT_PD, SYSTEM_PROMPT_PD
from api.settings import Settings

MessageType = Literal["create", "update"]

# weave.init("opentronsai/OpentronsAI-Phase-May-23-25")
weave.init("pentronsai-junk-may-28-25")
settings: Settings = Settings()
logger = structlog.stdlib.get_logger(settings.logger_name)
ROOT_PATH: Path = Path(Path(__file__)).parent.parent.parent
REPO_ROOT: Path = Path(Path(__file__)).parent.parent.parent.parent


class AnthropicPredict:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings
        self.max_tokens: int = 20000
        self.client: Anthropic = Anthropic(api_key=settings.anthropic_api_key.get_secret_value())
        self.model_name: str = settings.anthropic_model_name
        self.model_helper: str = settings.model_helper
        self.system_prompt: str = SYSTEM_PROMPT
        self.PROMPT_PD = PROMPT_PD
        self.path_docs: Path = ROOT_PATH / "api" / "storage" / "docs"
        self.path_docs_pd: Path = ROOT_PATH / "api" / "storage" / "docs" / "pd"
        self.path_api_docs: Path = ROOT_PATH / "api" / "storage" / "api_docs" / "api_docs_struct.md"
        self.system_prompt_pd = self.get_system_prompt_pd()

        self.cached_docs: List[MessageParam] = cast(
            List[MessageParam],
            [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": DOCUMENTS.format(doc_content=self.get_docs()), "cache_control": {"type": "ephemeral"}}
                    ],
                }
            ],
        )
        self.cached_api_docs: List[MessageParam] = cast(
            List[MessageParam],
            [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": self.get_api_docs(), "cache_control": {"type": "ephemeral"}}],
                }
            ],
        )
        self.tools: List[Dict[str, Any]] = [
            {
                "name": "simulate_protocol",
                "description": "Simulates the python protocol on user input. Returned value is text indicating if protocol is successful.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "protocol": {"type": "string", "description": "protocol in python for simulation"},
                    },
                    "required": ["protocol"],
                },
            }
        ]

    @tracer.wrap()
    def get_system_prompt_pd(self) -> List[Dict[str, Any]]:
        """
        Get the system prompt for the PD model
        """

        def load_file_content(filename: str) -> str:
            filepath = self.path_docs_pd / filename
            print(f"Trying to load: {filepath}")  # Debug print
            with open(filepath, "r") as f:
                return f.read()

        deck_layout = load_file_content(filename="deck_layout.md")
        tip_handling = load_file_content("tip_handling.md")
        step_types = load_file_content("form-types.txt")
        loadnames = load_file_content("pd_api_names.md")
        load_step_doc = load_file_content("step_doc.md")
        expected_json = load_file_content("expected.md")
        # complete documents
        formatted_documents_pd = DOCUMENTS_PD.format(
            DECK_LAYOUT=deck_layout,
            TIP_HANDLING=tip_handling,
            STEP_TYPES=step_types,
            LOADNAMES=loadnames,
            LOAD_STEP=load_step_doc,
        )

        # complete prompt
        self.PROMPT_PD = self.PROMPT_PD.format(EXPECTED_JSON=expected_json, USER_PROMPT="{USER_PROMPT}")

        system_content = [
            {
                "type": "text",
                "text": SYSTEM_PROMPT_PD,
            },
            {"type": "text", "text": formatted_documents_pd, "cache_control": {"type": "ephemeral"}},
        ]
        # Cast to satisfy mypy return type
        return cast(List[Dict[str, Any]], system_content)

    @tracer.wrap()
    def get_docs(self) -> str:
        """
        Processes documents from a directory and returns their content wrapped in XML tags.
        Each document is wrapped in <document> tags with metadata subtags.

        Returns:
            str: XML-formatted string containing all documents and their metadata
        """
        logger.info("Getting docs", extra={"path": str(self.path_docs)})
        xml_output = ["<documents>"]
        for file_path in self.path_docs.iterdir():
            try:
                # Skip directories
                if file_path.is_dir():
                    continue

                content = file_path.read_text(encoding="utf-8")
                document_xml = [
                    "<document>",
                    f"  <source>{file_path.name}</source>",
                    "   <document_content>",
                    f"    {content}",
                    "   </document_content>",
                    "</document>",
                ]
                xml_output.extend(document_xml)

            except Exception as e:
                logger.error("Error processing file", extra={"file": file_path.name, "error": str(e)})
                continue

        xml_output.append("</documents>")
        return "\n".join(xml_output)

    @tracer.wrap()
    def get_api_docs(self) -> str:
        """
        Read Python API v2 docs and return as string
        """
        logger.info("Getting Python API v2 docs", extra={"path": str(self.path_api_docs)})
        with open(self.path_api_docs, "r") as f:
            v2_doc_content = f.read()
        return f"<python_v2_api_doc>\n{v2_doc_content}\n</python_v2_api_doc>"

    def parse_relevant_files_and_get_content(self, api_info_output: str) -> str:
        """
        Parse the output of get_api_info and construct XML content with file contents.

        Args:
            api_info_output: The output from get_api_info containing <relevant_files> tags

        Returns:
            String containing XML formatted file contents
        """
        match = re.search(r"<relevant_files>(.*?)</relevant_files>", api_info_output, re.DOTALL)
        if not match:
            return "<relevant_file_content>\n</relevant_file_content>"

        files_content = match.group(1).strip()
        filenames = [f.strip() for f in files_content.split(",") if f.strip()]
        xml_content = "<relevant_file_content>\n"

        for filename in filenames:
            filepath = f"{self.path_api_docs.parent}/{filename}"
            try:
                with open(filepath, "r") as f:
                    content = f.read()

                xml_content += f"<file name='{filename}'>\n"
                xml_content += "<content>\n"
                xml_content += content
                xml_content += "\n</content>\n"
                xml_content += "</file>\n"
            except FileNotFoundError:
                # Skip files that don't exist
                continue
            except Exception:
                # Skip files that can't be read
                continue

        xml_content += "</relevant_file_content>"
        return xml_content

    @tracer.wrap()
    def get_relevant_api_docs(self, query: str, user_id: str) -> str:
        """
        Get relevant API docs based on the user's prompt
        """
        with open(self.path_api_docs, "r") as f:
            api_docs_structure = f.read()

        msg = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {"type": "text", "media_type": "text/plain", "data": api_docs_structure},
                        "title": "API Documentation Structure",
                        "context": "This is the structure of Opentrons Python API V2 Documentation with descriptions of each file.",
                        "cache_control": {"type": "ephemeral"},
                    },
                    {"type": "text", "text": PROMPT_FIND_RELEVANT_DOCS.format(USER_QUERY=query)},
                ],
            }
        ]

        response = self.client.messages.create(  # type: ignore[call-overload]
            model=self.model_helper,
            messages=msg,
            max_tokens=1024,
            temperature=0.0,
            system="You are a helpful assistant that analyzes documentation structure to find relevant files.",
            metadata={"user_id": user_id},
        )

        files_content = response.content[0].text.strip()
        xml_content = self.parse_relevant_files_and_get_content(files_content)
        return xml_content

    @tracer.wrap()
    def _process_message(self, user_id: str, messages: List[MessageParam], message_type: MessageType) -> Message:
        """
        Internal method to handle message processing with different system prompts.
        For now, system prompt is the same.
        """

        response: Message = self.client.messages.create(  # type: ignore[call-overload]
            max_tokens=self.max_tokens,
            messages=messages,
            model=self.model_name,
            system=self.system_prompt,
            tools=self.tools,
            metadata={"user_id": user_id},
            temperature=0.0,
        )

        logger.info(
            f"Token usage: {message_type.capitalize()}",
            extra={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "cache_read": getattr(response.usage, "cache_read_input_tokens", "---"),
                "cache_create": getattr(response.usage, "cache_creation_input_tokens", "---"),
            },
        )
        return response

    @tracer.wrap()
    def process_message(
        self, user_id: str, prompt: str, history: List[MessageParam] | None = None, message_type: MessageType = "create"
    ) -> str | None:
        """Unified method for creating and updating messages"""
        try:
            messages: List[MessageParam] = self.cached_docs.copy()
            if history:
                messages += history

            if len(messages) == 1:
                relevant_api_docs = self.get_relevant_api_docs(prompt, user_id)
                prompt = f"{prompt}\n\n{relevant_api_docs}"

            messages.append({"role": "user", "content": PROMPT.format(USER_PROMPT=prompt)})
            response = self._process_message(user_id=user_id, messages=messages, message_type=message_type)

            if response.content[-1].type == "tool_use":
                tool_use = response.content[-1]
                messages.append({"role": "assistant", "content": response.content})
                result = self.handle_tool_use(tool_use.name, tool_use.input)  # type: ignore[arg-type]
                messages.append(
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use.id,
                                "content": result,
                            }
                        ],
                    }
                )
                follow_up = self._process_message(user_id=user_id, messages=messages, message_type=message_type)
                if follow_up.content and follow_up.content[0].type == "text":
                    # Simply return the text directly
                    return follow_up.content[0].text
                logger.error("Unexpected follow-up response type")
                return None

            elif response.content and response.content[0].type == "text":
                # Simply return the text directly
                return response.content[0].text

            logger.error("Unexpected response type")
            return None
        except Exception as e:
            logger.error(f"Error in {message_type} method", extra={"error": str(e)})
            return None

    @tracer.wrap()
    def process_message_pd(
        self, user_id: str, prompt: str, history: List[MessageParam] | None = None, message_type: MessageType = "create"
    ) -> str | None:
        """return a partial json protocol"""
        try:
            if history is None:
                messages = []
            else:
                messages = history

            messages.append({"role": "user", "content": self.PROMPT_PD.format(USER_PROMPT=prompt)})

            response: Message = self.client.messages.create(
                max_tokens=self.max_tokens,
                messages=messages,
                model=self.model_name,
                system=cast(Iterable[TextBlockParam], self.system_prompt_pd),
                metadata={"user_id": user_id},
                temperature=0.0,
            )
            if response.content and response.content[0].type == "text":
                response_text = response.content[0].text
                return response_text

            logger.error("Unexpected response type")
            return None
        except Exception as e:
            logger.error(f"Error in {message_type} method", extra={"error": str(e)})
            return None

    @tracer.wrap()
    def create(self, user_id: str, prompt: str, history: List[MessageParam] | None = None) -> str | None:
        return self.process_message(user_id, prompt, history, "create")

    @tracer.wrap()
    def create_pd(self, user_id: str, prompt: str, history: List[MessageParam] | None = None) -> str | None:
        return self.process_message_pd(user_id, prompt, history, "create")

    def deep_get(self, data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
        """
        Safely navigate nested dictionaries using a sequence of keys.

        Args:
            data: The dictionary to navigate
            *keys: Variable number of keys to traverse
            default: Default value to return if any key is missing

        Returns:
            The value at the nested path, or default if any key is missing
        """
        current = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default if default is not None else {}
        return current

    @tracer.wrap()
    def standardize(self, protocol: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reorganize the data structure according to the standard schema while preserving content.
        SCHEMA
        {
        "$otSharedSchema": "#/protocol/schemas/8",
        "schemaVersion": 8,
        "metadata": {
            "protocolName": "",
            "author": "OpentronsAI",
            "description": "",
            "created": 1742475612222,
            "lastModified": 1742475730624,
            "source": "OpentronsAI",
            "category": null,
            "subcategory": null,
            "tags": []
        },
        "designerApplication": {
            "name": "opentrons/protocol-designer",
            "version": "8.4.4",
            "data": {
            "_internalAppBuildDate": "",
            "pipetteTiprackAssignments": {},
            "dismissedWarnings": {"form": [], "timeline": []},
            "ingredients": {},
            "ingredLocations": {},
            "savedStepForms": {
                "__INITIAL_DECK_SETUP_STEP__": {
                "stepType": "manualIntervention",
                "id": "__INITIAL_DECK_SETUP_STEP__",
                "labwareLocationUpdate": {},
                "pipetteLocationUpdate": {},
                "moduleLocationUpdate": {},
                "trashBinLocationUpdate": {},
                "wasteChuteLocationUpdate": {},
                "stagingAreaLocationUpdate": {},
                "gripperLocationUpdate": {}
                },
                "step": {}
            },
            "orderedStepIds": [],
            "pipettes": {},
            "modules": {},
            "labware": {}
            }
        },
        "robot": {},
        "labwareDefinitions": {},
        }
        """
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        original_saved_forms = self.deep_get(protocol, "designerApplication", "data", "savedStepForms")
        # Make a copy to modify, or ensure original_steps is a new dict
        original_steps_without_initial = {k: v for k, v in original_saved_forms.items() if k != "__INITIAL_DECK_SETUP_STEP__"}
        original_ordered_ids = self.deep_get(protocol, "designerApplication", "data", "orderedStepIds", default=[])

        standard = {
            "$otSharedSchema": self.deep_get(protocol, "$otSharedSchema", default="#/protocol/schemas/8"),
            "schemaVersion": self.deep_get(protocol, "schemaVersion", default=8),
            "metadata": {
                "protocolName": self.deep_get(protocol, "metadata", "protocolName", default=""),
                "author": self.deep_get(protocol, "metadata", "author", default="OpentronsAI"),
                "description": self.deep_get(protocol, "metadata", "description", default=""),
                "created": now_ms,
                "lastModified": now_ms,
                "source": "OpentronsAI",
                "category": self.deep_get(protocol, "metadata", "category", default=None),
                "subcategory": self.deep_get(protocol, "metadata", "subcategory", default=None),
                "tags": self.deep_get(protocol, "metadata", "tags", default=[]),
            },
            "designerApplication": {
                "name": self.deep_get(protocol, "designerApplication", "name", default="opentrons/protocol-designer"),
                "version": "8.4.4",
                "data": {
                    "_internalAppBuildDate": self.deep_get(
                        protocol, "designerApplication", "data", "_internalAppBuildDate", default="Wed, 06 May 2025 21:05:04 GMT"
                    ),
                    "pipetteTiprackAssignments": self.deep_get(protocol, "designerApplication", "data", "pipetteTiprackAssignments"),
                    "dismissedWarnings": {"form": [], "timeline": []},
                    "ingredients": self.deep_get(protocol, "designerApplication", "data", "ingredients"),
                    "ingredLocations": self.deep_get(protocol, "designerApplication", "data", "ingredLocations"),
                    "savedStepForms": {
                        "__INITIAL_DECK_SETUP_STEP__": {
                            "stepType": "manualIntervention",
                            "id": "__INITIAL_DECK_SETUP_STEP__",
                            "labwareLocationUpdate": self.deep_get(
                                protocol,
                                "designerApplication",
                                "data",
                                "savedStepForms",
                                "__INITIAL_DECK_SETUP_STEP__",
                                "labwareLocationUpdate",
                            ),
                            "pipetteLocationUpdate": self.deep_get(
                                protocol,
                                "designerApplication",
                                "data",
                                "savedStepForms",
                                "__INITIAL_DECK_SETUP_STEP__",
                                "pipetteLocationUpdate",
                            ),
                            "moduleLocationUpdate": self.deep_get(
                                protocol,
                                "designerApplication",
                                "data",
                                "savedStepForms",
                                "__INITIAL_DECK_SETUP_STEP__",
                                "moduleLocationUpdate",
                            ),
                            "trashBinLocationUpdate": (
                                {"trashbin-1": "cutout12"}
                                if self.deep_get(protocol, "robot", "model") == "OT-2 Standard"
                                else self.deep_get(
                                    protocol,
                                    "designerApplication",
                                    "data",
                                    "savedStepForms",
                                    "__INITIAL_DECK_SETUP_STEP__",
                                    "trashBinLocationUpdate",
                                )
                            ),
                            "wasteChuteLocationUpdate": self.deep_get(
                                protocol,
                                "designerApplication",
                                "data",
                                "savedStepForms",
                                "__INITIAL_DECK_SETUP_STEP__",
                                "wasteChuteLocationUpdate",
                            ),
                            "stagingAreaLocationUpdate": self.deep_get(
                                protocol,
                                "designerApplication",
                                "data",
                                "savedStepForms",
                                "__INITIAL_DECK_SETUP_STEP__",
                                "stagingAreaLocationUpdate",
                            ),
                            "gripperLocationUpdate": self.deep_get(
                                protocol,
                                "designerApplication",
                                "data",
                                "savedStepForms",
                                "__INITIAL_DECK_SETUP_STEP__",
                                "gripperLocationUpdate",
                            ),
                        },
                        **original_steps_without_initial,
                    },
                    "orderedStepIds": original_ordered_ids,
                    "pipettes": self.deep_get(protocol, "designerApplication", "data", "pipettes"),
                    "modules": self.deep_get(protocol, "designerApplication", "data", "modules"),
                    "labware": self.deep_get(protocol, "designerApplication", "data", "labware"),
                },
            },
            "robot": self.deep_get(protocol, "robot"),
            "labwareDefinitions": {},
        }

        return standard

    @tracer.wrap()
    def fillup_pd(self, json_str: str) -> str:  # noqa: C901
        """
        Fill up the JSON protocol with the missing fields.
        """

        try:
            data = json.loads(json_str)

            # Add schema version and shared schema
            data["$otSharedSchema"] = "#/protocol/schemas/8"
            data["schemaVersion"] = 8

            # Extend metadata
            data["metadata"].update(
                {
                    "author": "OpentronsAI",
                    "source": "OpentronsAI",
                    "category": None,
                    "subcategory": None,
                    "tags": [],
                }
            )

            # Add designer application
            data["designerApplication"].update(
                {
                    "name": "opentrons/protocol-designer",
                    "version": "8.4.4",
                }
            )

            # Add data
            dt = datetime.now(timezone.utc)
            formatted_date = dt.strftime("%a, %d %b %Y %H:%M:%S GMT")

            data["designerApplication"]["data"].update(
                {"_internalAppBuildDate": formatted_date, "dismissedWarnings": {"form": [], "timeline": []}}
            )

            # Add labware definitions
            data["labwareDefinitions"] = {}

            # Follow PD schema
            data = self.standardize(data)

            return json.dumps(data, indent=2)
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            return ""

    @tracer.wrap()
    def update(self, user_id: str, prompt: str, history: List[MessageParam] | None = None) -> str | None:
        return self.process_message(user_id, prompt, history, "update")

    @tracer.wrap()
    def handle_tool_use(self, func_name: str, func_params: Dict[str, Any]) -> str:
        if func_name == "simulate_protocol":
            results = self.simulate_protocol(**func_params)
            return results

        logger.error("Unknown tool", extra={"tool": func_name})
        raise ValueError(f"Unknown tool: {func_name}")

    @tracer.wrap()
    def simulate_protocol(self, protocol: str) -> str:
        url = "https://Opentrons-simulator.hf.space/protocol"
        protocol_name = str(uuid.uuid4()) + ".py"
        data = {"name": protocol_name, "content": protocol}
        hf_token: str = self.settings.huggingface_api_key.get_secret_value()
        headers = {"Content-Type": "application/json", "Authorization": "Bearer {}".format(hf_token)}
        response = requests.post(url, json=data, headers=headers)

        if response.status_code != 200:
            logger.error("Simulation request failed", extra={"status": response.status_code, "error": response.text})
            return f"Error: {response.text}"

        response_data = response.json()
        if "error_message" in response_data:
            logger.error("Simulation error", extra={"error": response_data["error_message"]})
            return str(response_data["error_message"])
        elif "protocol_name" in response_data:
            return str(response_data["run_status"])
        else:
            logger.error("Unexpected response", extra={"response": response_data})
            return "Unexpected response"


def main() -> None:
    """Intended for testing this class locally."""
    import sys
    from pathlib import Path

    # # Add project root to Python path
    root_dir = Path(__file__).parent.parent.parent
    sys.path.insert(0, str(root_dir))

    from rich import print
    from rich.prompt import Prompt

    settings = Settings()
    llm = AnthropicPredict(settings)
    Prompt.ask("Type a prompt to send to the Anthropic API:")

    completion = llm.create(user_id="1", prompt="hi", history=None)
    print(completion)


if __name__ == "__main__":
    main()
