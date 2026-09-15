import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, ContextManager, Dict, List, Literal, Optional, cast

import anthropic
import requests
import structlog
import weave
from anthropic import Anthropic, AsyncAnthropic
from anthropic.types import ContentBlockParam, DocumentBlockParam, Message, MessageParam, TextBlockParam, ToolParam
from weave.trace.context.call_context import set_tracing_enabled

from api.domain.config_anthropic import DOCUMENTS, PROMPT, PROMPT_FIND_RELEVANT_DOCS, SYSTEM_PROMPT
from api.domain.config_pd import DOCUMENTS_PD, PROMPT_PD, SYSTEM_PROMPT_PD
from api.settings import Settings, get_settings
from api.utils.api_docs_metadata import get_default_api_level
from api.utils.docs_links import synced_doc_path_to_production_url

MessageType = Literal["create", "update"]


# Global variable to track Weave initialization
_weave_initialized = False


def setup_weave_analytics(enable_analytics: bool) -> None:
    """Setup Weave initialization only (thread-safe, request-agnostic)."""
    global _weave_initialized

    logger.debug(f"Analytics {'enabled' if enable_analytics else 'disabled'} for this request")

    # Initialize Weave on first call (regardless of analytics preference)
    if not _weave_initialized:
        try:
            weave.init("opentronsai/OpentronsAI-Phase-May-23-25")
            logger.info("Weave initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Weave: {e}")
        finally:
            # Mark as initialized regardless of success/failure to prevent retries
            _weave_initialized = True


def get_tracing_context(enable_analytics: bool) -> ContextManager[None]:
    """Get context manager that controls Weave tracing for this specific request."""
    return set_tracing_enabled(enable_analytics)


settings: Settings = get_settings()
logger = structlog.stdlib.get_logger(settings.logger_name)
ROOT_PATH: Path = Path(Path(__file__)).parent.parent.parent
API_DOCS_ROOT: Path = ROOT_PATH / "api" / "storage" / "api_docs"
API_DOCS_CONTENT_ROOT: Path = API_DOCS_ROOT / "docs" / "v2"
API_DOCS_STRUCT_PATH: Path = API_DOCS_ROOT / "api_docs_struct.md"


class AnthropicPredict:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings
        self.max_tokens: int = int(settings.anthropic_max_tokens)
        self.client: AsyncAnthropic = AsyncAnthropic(api_key=settings.anthropic_api_key.get_secret_value())
        self._sync_client: Anthropic = Anthropic(api_key=settings.anthropic_api_key.get_secret_value())
        self.model_name: str = settings.anthropic_model_name
        self.model_helper: str = settings.model_helper
        default_api_level = get_default_api_level()
        self.system_prompt: str = SYSTEM_PROMPT.replace("__DEFAULT_API_LEVEL__", default_api_level)
        self.prompt: str = PROMPT.replace("__DEFAULT_API_LEVEL__", default_api_level)
        self.PROMPT_PD = PROMPT_PD
        self.path_docs: Path = ROOT_PATH / "api" / "storage" / "docs"
        self.path_docs_pd: Path = ROOT_PATH / "api" / "storage" / "docs" / "pd"
        self.path_api_docs: Path = API_DOCS_STRUCT_PATH
        self._api_docs_content_root: Path = API_DOCS_CONTENT_ROOT
        self.system_prompt_pd = self.get_system_prompt_pd()

        self.cached_docs: List[MessageParam] = [
            {
                "role": "user",
                "content": [
                    TextBlockParam(type="text", text=DOCUMENTS.format(doc_content=self.get_docs()), cache_control={"type": "ephemeral"})
                ],
            }
        ]
        self.cached_api_docs: List[MessageParam] = [
            {
                "role": "user",
                "content": [TextBlockParam(type="text", text=self.get_api_docs(), cache_control={"type": "ephemeral"})],
            }
        ]
        self.tools: List[ToolParam] = [
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
            },
            {
                "name": "get_relevant_api_docs",
                "description": """Retrieves relevant API documentation based on the user's query.
                Use this tool when you need specific Opentrons API information to help generate
                protocols or answer technical questions about protocol implementation.""",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The user's query or context about what API documentation is needed"},
                    },
                    "required": ["query"],
                },
                "cache_control": {"type": "ephemeral"},
            },
        ]

    def get_system_prompt_pd(self) -> List[TextBlockParam]:
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

        system_content: List[TextBlockParam] = [
            TextBlockParam(type="text", text=SYSTEM_PROMPT_PD),
            TextBlockParam(type="text", text=formatted_documents_pd, cache_control={"type": "ephemeral"}),
        ]
        return system_content

    def get_docs(self) -> str:
        """
        Processes documents from a directory and returns their content wrapped in XML tags.
        Each document is wrapped in <system_doc> tags with metadata subtags.

        Returns:
            str: XML-formatted string containing all system documentation
        """
        logger.info("Getting docs", extra={"path": str(self.path_docs)})
        xml_output = ["<system_documentation>"]
        for file_path in self.path_docs.iterdir():
            try:
                # Skip directories
                if file_path.is_dir():
                    continue
                print(f"Load doc file: {file_path}")

                content = file_path.read_text(encoding="utf-8")
                document_xml = [
                    "<system_doc>",
                    f"  <title>{file_path.name}</title>",
                    "  <type>reference</type>",
                    "   <content>",
                    f"    {content}",
                    "   </content>",
                    "</system_doc>",
                ]
                xml_output.extend(document_xml)

            except Exception as e:
                logger.error("Error processing file", extra={"file": file_path.name, "error": str(e)})
                continue

        xml_output.append("</system_documentation>")
        return "\n".join(xml_output)

    def get_api_docs(self) -> str:
        """
        Read Python API v2 docs and return as string
        """
        logger.info("Getting Python API v2 docs", extra={"path": str(self.path_api_docs)})
        with open(self.path_api_docs, "r") as f:
            v2_doc_content = f.read()
        return f"<python_v2_api_doc>\n{v2_doc_content}\n</python_v2_api_doc>"

    def _api_doc_resolve_path(self, filename: str) -> Optional[Path]:
        """Resolve a structure path to a synced markdown file under api/storage/api_docs/docs/v2."""
        normalized = filename.strip().strip(",")
        if not normalized or not normalized.endswith(".md"):
            return None

        return self._api_docs_content_root / normalized

    def parse_relevant_files_and_get_content(self, api_info_output: str) -> str:
        """
        Parse the output of get_api_info and construct XML content with file contents.
        Reads from synced markdown docs under api/storage/api_docs/docs/v2.
        """
        match = re.search(r"<relevant_files>(.*?)</relevant_files>", api_info_output, re.DOTALL)
        if not match:
            return "<relevant_file_content>\n</relevant_file_content>"

        files_content = match.group(1).strip()
        filenames = [f.strip() for f in files_content.split(",") if f.strip()]
        xml_content = "<relevant_file_content>\n"

        for filename in filenames:
            filepath = self._api_doc_resolve_path(filename)
            if filepath is None:
                logger.debug("API doc path not resolved (skip)", extra={"path": filename})
                continue
            try:
                with open(filepath, "r") as f:
                    content = f.read()
            except FileNotFoundError:
                logger.debug("API doc file not found", extra={"path": str(filepath)})
                continue
            except Exception as e:
                logger.warning("Error reading API doc file", extra={"path": str(filepath), "error": str(e)})
                continue
            production_url = synced_doc_path_to_production_url(filename)
            xml_content += f"<file name='{filename}' url='{production_url}'>\n"
            xml_content += f"<production_url>{production_url}</production_url>\n"
            xml_content += "<content>\n"
            xml_content += content
            xml_content += "\n</content>\n"
            xml_content += "</file>\n"

        xml_content += "</relevant_file_content>"
        return xml_content

    async def get_relevant_api_docs(self, query: str, user_id: str) -> str:
        """
        Get relevant API docs based on the user's prompt
        """
        logger.info("get_relevant_api_docs method called")

        with open(self.path_api_docs, "r") as f:
            api_docs_structure = f.read()

        msg = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {"type": "text", "media_type": "text/plain", "data": api_docs_structure},
                        "title": "Python API V2 Documentation Structure",
                        "context": "This is the structure of Opentrons Python API V2 Documentation with descriptions of each file.",
                        "cache_control": {"type": "ephemeral"},
                    },
                    {"type": "text", "text": PROMPT_FIND_RELEVANT_DOCS.format(USER_QUERY=query)},
                ],
            }
        ]

        response = await self.client.messages.create(  # type: ignore[call-overload]
            model=self.model_helper,
            messages=msg,
            max_tokens=1024,
            system="You are a helpful assistant that analyzes documentation structure to find relevant files.",
            metadata={"user_id": user_id},
            thinking={"type": "disabled"},
        )

        files_content = response.content[0].text.strip()
        xml_content = self.parse_relevant_files_and_get_content(files_content)
        return xml_content

    async def _process_message(self, user_id: str, messages: List[MessageParam], message_type: MessageType) -> Message:
        """
        Internal method to handle message processing with different system prompts.
        For now, system prompt is the same.
        """

        # With the Files API, uploaded files should be automatically accessible
        # when file IDs are mentioned in the message content (which we do in _create_file_attachment_blocks)
        # Use streaming to avoid the SDK's 10-minute limit for long-running requests (e.g. large max_tokens).
        async with self.client.messages.stream(
            max_tokens=self.max_tokens,
            messages=messages,
            model=self.model_name,
            system=self.system_prompt,
            tools=self.tools,
            metadata={"user_id": user_id},
            thinking={"type": "disabled"},
        ) as stream:
            response: Message = await stream.get_final_message()

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

    def _create_file_attachment_blocks(
        self,
        file_references: Optional[List[Dict[str, str]]],
        user_id: str,  # noqa: ARG002
    ) -> List[ContentBlockParam]:
        """
        Create content blocks with file attachments using appropriate format for each file type

        Args:
            file_references: List of file references with content included
            user_id: User ID (kept for interface compatibility, not used in simplified approach)

        Returns:
            List of content blocks for Anthropic API (text blocks for CSV/Python, document blocks for PDF)
        """
        if not file_references:
            return []

        content_blocks: List[ContentBlockParam] = []

        # Add wrapper for user uploaded files
        user_files_header = TextBlockParam(type="text", text="<user_uploaded_files>\n")
        content_blocks.append(user_files_header)

        for file_ref in file_references:
            filename = file_ref.get("name", "Attached File")
            # file_type is the internal type ("pdf", "csv", "python"), not MIME type
            file_type = file_ref.get("type", "unknown").lower()
            file_content = file_ref.get("content", "")

            if not file_content:
                # Fallback if content is missing
                text_block = TextBlockParam(
                    type="text",
                    text=f'<user_file name="{filename}" type="{file_type}" id="{file_ref.get("id", "unknown")}">\n'
                    f"Filename: {filename}\n"
                    f"[File content is empty or missing]\n"
                    f"</user_file>\n\n",
                )
                content_blocks.append(text_block)
                continue

            if file_type == "pdf":
                # PDF files are sent as base64-encoded documents
                # Add explicit filename context that Claude cannot ignore
                logger.info(f"Creating PDF document block with title: '{filename}'")

                # Add a text block to start the user file wrapper with prominent filename
                pdf_intro_text = f'<user_file name="{filename}" type="{file_type}" id="{file_ref.get("id", "unknown")}">\n'
                pdf_intro_text += f"Filename: {filename}\n"
                filename_text_block = TextBlockParam(type="text", text=pdf_intro_text)
                content_blocks.append(filename_text_block)

                # Then add the actual PDF document
                doc_block = DocumentBlockParam(
                    type="document",
                    source={"type": "base64", "media_type": "application/pdf", "data": file_content},
                    title=filename,
                )
                content_blocks.append(doc_block)

                # Close the user file wrapper
                pdf_close_text = "</user_file>\n\n"
                filename_close_block = TextBlockParam(type="text", text=pdf_close_text)
                content_blocks.append(filename_close_block)
            else:
                # CSV and Python files are sent as text blocks
                text_block = TextBlockParam(
                    type="text",
                    text=f'<user_file name="{filename}" type="{file_type}" id="{file_ref.get("id", "unknown")}">\n'
                    f"Filename: {filename}\n"
                    f"{file_content}\n"
                    f"</user_file>\n\n",
                )
                content_blocks.append(text_block)

        # Close wrapper for user uploaded files
        user_files_footer = TextBlockParam(type="text", text="</user_uploaded_files>\n")
        content_blocks.append(user_files_footer)

        return content_blocks

    def _process_historical_attachments(self, attachment: Dict[str, Any]) -> Dict[str, str]:
        """Process a single historical attachment and return file reference."""
        attachment_keys = list(attachment.keys())
        attachment_name = attachment.get("name")
        attachment_filename = attachment.get("filename")
        logger.info(f"Processing historical attachment: keys={attachment_keys}, name={attachment_name}, filename={attachment_filename}")

        return {
            "id": attachment.get("id", ""),
            "name": attachment.get("name", ""),
            "type": attachment.get("type", ""),
            "content": attachment.get("content", ""),
            "media_type": self._determine_media_type(attachment.get("type", "")),
        }

    def _build_conversation_history(self, history_with_attachments: List[Dict[str, Any]], user_id: str) -> List[MessageParam]:
        """Build conversation history with proper file context."""
        messages: List[MessageParam] = []

        for msg in history_with_attachments:
            if msg["role"] == "user" and msg.get("attachments"):
                # Create content blocks for this historical message
                user_content: List[ContentBlockParam] = [TextBlockParam(type="text", text=msg["content"])]

                # Add file blocks for this specific message's attachments
                if msg["attachments"]:
                    historical_file_refs = [self._process_historical_attachments(attachment) for attachment in msg["attachments"]]

                    # Add file blocks to this message
                    file_blocks = self._create_file_attachment_blocks(historical_file_refs, user_id)
                    user_content.extend(file_blocks)

                messages.append({"role": "user", "content": user_content})
            else:
                # Regular message without attachments
                messages.append({"role": msg["role"], "content": msg["content"]})

        return messages

    def _create_current_user_message(self, prompt: str, current_msg_files: Optional[List[Dict[str, str]]], user_id: str) -> MessageParam:
        """Create the current user message with file attachments."""
        current_user_content: List[ContentBlockParam] = [TextBlockParam(type="text", text=self.prompt.format(USER_PROMPT=prompt))]

        # Add NEW file attachments to current message
        if current_msg_files:
            file_refs_summary = [{k: v for k, v in ref.items() if k != "content"} for ref in current_msg_files]
            logger.info(f"Processing new file attachments: {file_refs_summary}")

            new_file_blocks = self._create_file_attachment_blocks(current_msg_files, user_id)
            current_user_content.extend(new_file_blocks)
            logger.info(
                "Added new file attachments to current message",
                extra={
                    "user_id": user_id,
                    "num_new_files": len(current_msg_files),
                    "file_ids": [ref["id"] for ref in current_msg_files],
                },
            )

        return {"role": "user", "content": current_user_content}

    async def process_chat_with_attachments(
        self,
        user_id: str,
        prompt: str,
        history_with_attachments: List[Dict[str, Any]] | None = None,
        message_type: MessageType = "create",
        current_msg_files: Optional[List[Dict[str, str]]] = None,
    ) -> str | None:
        """Process chat message with file attachments in conversation history"""
        try:
            messages: List[MessageParam] = self.cached_docs.copy()

            # Build proper conversation history with files in their original context
            if history_with_attachments:
                historical_messages = self._build_conversation_history(history_with_attachments, user_id)
                messages.extend(historical_messages)

            # Create and add current user message
            current_user_message = self._create_current_user_message(prompt, current_msg_files, user_id)
            messages.append(current_user_message)

            # Log the improved message structure
            messages_with_files = 0
            for msg in messages:
                content = msg.get("content")
                if isinstance(content, list) and len(content) > 1:
                    messages_with_files += 1
            logger.info(
                "Constructed conversation with proper file context",
                extra={
                    "user_id": user_id,
                    "total_messages": len(messages),
                    "messages_with_files": messages_with_files,
                },
            )

            response = await self._process_message(user_id=user_id, messages=messages, message_type=message_type)
            return await self._handle_response(response, messages, user_id, message_type)

        except Exception as e:
            logger.error(f"Error in process_chat_with_attachments: {str(e)}", exc_info=True)
            raise

    async def _handle_response(
        self, response: Message, messages: List[MessageParam], user_id: str, message_type: MessageType
    ) -> str | None:
        """Handle the response from the AI model, including tool use."""
        # Handle tool use if present
        if response.content[-1].type == "tool_use":
            tool_use = response.content[-1]
            messages.append({"role": "assistant", "content": response.content})
            result = await self.handle_tool_use(tool_use.name, cast(Dict[str, Any], tool_use.input), user_id)
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
            follow_up = await self._process_message(user_id=user_id, messages=messages, message_type=message_type)
            if follow_up.content and follow_up.content[0].type == "text":
                return follow_up.content[0].text
            logger.error("Unexpected follow-up response type")
            return None

        elif response.content and response.content[0].type == "text":
            return response.content[0].text

        logger.error("Unexpected response type")
        return None

    def _determine_media_type(self, file_type: str) -> str:
        """Determine media type from file type."""
        type_mapping = {
            "csv": "application/json",
            "python": "text/x-python",
            "pdf": "application/pdf",
        }
        return type_mapping.get(file_type, "text/plain")

    async def process_message(
        self,
        user_id: str,
        prompt: str,
        history: List[MessageParam] | None = None,
        message_type: MessageType = "create",
        file_references: Optional[List[Dict[str, str]]] = None,
    ) -> str | None:
        """Unified method for creating and updating messages"""
        try:
            messages: List[MessageParam] = self.cached_docs.copy()
            if history:
                messages += history

            user_content: List[ContentBlockParam] = [TextBlockParam(type="text", text=self.prompt.format(USER_PROMPT=prompt))]

            # Add file attachments with actual content
            if file_references:
                file_blocks = self._create_file_attachment_blocks(file_references, user_id)
                user_content.extend(file_blocks)
                logger.info(
                    "Added file attachments to message",
                    extra={"num_files": len(file_references), "file_ids": [ref["id"] for ref in file_references]},
                )

            user_message: MessageParam = {"role": "user", "content": user_content}
            if file_references:
                logger.info(
                    "Message structure debug",
                    extra={
                        "user_id": user_id,
                        "content_types": [block.get("type") for block in user_content],
                        "has_document_blocks": any(block.get("type") == "document" for block in user_content),
                        "message_structure": user_message,
                    },
                )
            messages.append(user_message)
            response = await self._process_message(user_id=user_id, messages=messages, message_type=message_type)

            if response.content[-1].type == "tool_use":
                tool_use = response.content[-1]
                messages.append({"role": "assistant", "content": response.content})
                result = await self.handle_tool_use(tool_use.name, cast(Dict[str, Any], tool_use.input), user_id)
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
                follow_up = await self._process_message(user_id=user_id, messages=messages, message_type=message_type)
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
        except anthropic.APIError:
            raise
        except Exception as e:
            logger.error(f"Error in {message_type} method", extra={"error": str(e)})
            return None

    async def process_message_pd(
        self, user_id: str, prompt: str, history: List[MessageParam] | None = None, message_type: MessageType = "create"
    ) -> str | None:
        """return a partial json protocol"""
        try:
            if history is None:
                messages = []
            else:
                messages = history

            messages.append({"role": "user", "content": self.PROMPT_PD.format(USER_PROMPT=prompt)})

            # Use streaming to avoid the SDK's 10-minute limit for long-running requests.
            async with self.client.messages.stream(
                max_tokens=self.max_tokens,
                messages=messages,
                model=self.model_name,
                system=self.system_prompt_pd,
                metadata={"user_id": user_id},
                thinking={"type": "disabled"},
            ) as stream:
                response: Message = await stream.get_final_message()
            if response.content and response.content[0].type == "text":
                response_text = response.content[0].text
                return response_text

            logger.error("Unexpected response type")
            return None
        except anthropic.APIError:
            raise
        except Exception as e:
            logger.error(f"Error in {message_type} method", extra={"error": str(e)})
            return None

    async def create(self, user_id: str, prompt: str, history: List[MessageParam] | None = None) -> str | None:
        return await self.process_message(user_id, prompt, history, "create")

    async def create_pd(self, user_id: str, prompt: str, history: List[MessageParam] | None = None) -> str | None:
        return await self.process_message_pd(user_id, prompt, history, "create")

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

    async def update(self, user_id: str, prompt: str, history: List[MessageParam] | None = None) -> str | None:
        return await self.process_message(user_id, prompt, history, "update")

    async def handle_tool_use(self, func_name: str, func_params: Dict[str, Any], user_id: str) -> str:
        logger.info("Tool use invoked", extra={"tool_name": func_name})

        if func_name == "simulate_protocol":
            logger.info("Simulating protocol")
            results = await asyncio.to_thread(self.simulate_protocol, **func_params)
            return results
        elif func_name == "get_relevant_api_docs":
            query = func_params.get("query", "")
            logger.info("get_relevant_api_docs tool called")
            results = await self.get_relevant_api_docs(query, user_id)
            logger.info(
                "get_relevant_api_docs tool completed",
                extra={"result_length": len(results) if results else 0},
            )
            return results

        logger.error("Unknown tool", extra={"tool": func_name})
        raise ValueError(f"Unknown tool: {func_name}")

    def simulate_protocol(self, protocol: str) -> str:
        url = "https://Opentrons-simulator.hf.space/protocol"
        protocol_name = str(uuid.uuid4()) + ".py"
        data = {"name": protocol_name, "content": protocol}
        hf_token: str = self.settings.huggingface_api_key.get_secret_value()
        headers = {"Content-Type": "application/json", "Authorization": "Bearer {}".format(hf_token)}
        response = requests.post(url, json=data, headers=headers, timeout=60)

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

    llm = AnthropicPredict(get_settings())
    Prompt.ask("Type a prompt to send to the Anthropic API:")

    completion = asyncio.run(llm.create(user_id="1", prompt="hi", history=None))
    print(completion)


if __name__ == "__main__":
    main()
