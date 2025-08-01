import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, ContextManager, Dict, List, Literal, Optional

import requests
import structlog
import weave
from anthropic import Anthropic
from anthropic.types import ContentBlockParam, DocumentBlockParam, Message, MessageParam, TextBlockParam
from ddtrace import tracer
from weave.trace.context.call_context import set_tracing_enabled

from api.domain.config_anthropic import DOCUMENTS, PROMPT, PROMPT_FIND_RELEVANT_DOCS, SYSTEM_PROMPT
from api.domain.config_pd import DOCUMENTS_PD, PROMPT_PD, SYSTEM_PROMPT_PD
from api.settings import Settings

MessageType = Literal["create", "update"]


# Global variable to track Weave initialization
_weave_initialized = False


@tracer.wrap()
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


@tracer.wrap()
def get_tracing_context(enable_analytics: bool) -> ContextManager[None]:
    """Get context manager that controls Weave tracing for this specific request."""
    return set_tracing_enabled(enable_analytics)


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

    @tracer.wrap()
    def parse_relevant_files_and_get_content(self, api_info_output: str) -> str:
        """
        Parse the output of get_api_info and construct XML content with file contents.
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
                continue  # Skip files that don't exist
            except Exception:
                continue  # Skip files that can't be read

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
                        "title": "Python API V2 Documentation Structure",
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
            temperature=0.1,
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

        # With the Files API, uploaded files should be automatically accessible
        # when file IDs are mentioned in the message content (which we do in _create_file_attachment_blocks)
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

    def _create_file_attachment_blocks(
        self, file_references: Optional[List[Dict[str, str]]], user_id: str  # noqa: ARG002
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

        for file_ref in file_references:
            filename = file_ref.get("name", "Attached File")
            # file_type is the internal type ("pdf", "csv", "python"), not MIME type
            file_type = file_ref.get("type", "unknown").lower()
            file_content = file_ref.get("content", "")

            if not file_content:
                # Fallback if content is missing
                text_block = TextBlockParam(
                    type="text",
                    text=f"=== FILE: {filename} ({file_type.upper()}) ===\n\n"
                    f"[File content is empty or missing]\n\n"
                    f"=== END OF FILE: {filename} ===\n\n",
                )
                content_blocks.append(text_block)
                continue

            if file_type == "pdf":
                # PDF files are sent as base64-encoded documents
                # Add explicit filename context that Claude cannot ignore
                logger.info(f"Creating PDF document block with title: '{filename}'")

                # Add a text block with explicit filename information before the PDF
                pdf_intro_text = (
                    f"=== UPLOADED PDF FILE: {filename} ===\n\n"
                    f"The following document is the PDF file named '{filename}' that was uploaded:\n\n"
                )
                filename_text_block = TextBlockParam(type="text", text=pdf_intro_text)
                content_blocks.append(filename_text_block)

                # Then add the actual PDF document
                doc_block = DocumentBlockParam(
                    type="document",
                    source={"type": "base64", "media_type": "application/pdf", "data": file_content},
                    title=filename,
                )
                content_blocks.append(doc_block)
            else:
                # CSV and Python files are sent as text blocks
                # Add explicit filename context for all text-based files (consistent with PDF approach)
                if file_type.lower() == "python":
                    # Add explicit filename introduction similar to PDF approach
                    python_intro_text = (
                        f"=== UPLOADED PYTHON FILE: {filename} ===\n\n"
                        f"The following is the Python protocol file named '{filename}' that was uploaded:\n\n"
                    )
                    filename_intro_block = TextBlockParam(type="text", text=python_intro_text)
                    content_blocks.append(filename_intro_block)
                elif file_type.lower() == "csv":
                    # Add explicit filename introduction for CSV files
                    csv_intro_text = (
                        f"=== UPLOADED CSV FILE: {filename} ===\n\n"
                        f"The following is the CSV data file named '{filename}' that was uploaded:\n\n"
                    )
                    filename_intro_block = TextBlockParam(type="text", text=csv_intro_text)
                    content_blocks.append(filename_intro_block)

                # Add the file content
                text_block = TextBlockParam(
                    type="text",
                    text=f"=== FILE CONTENT ===\n\n{file_content}\n\n=== END OF FILE: {filename} ===\n\n",
                )
                content_blocks.append(text_block)

        return content_blocks

    def _process_historical_attachments(self, attachment: Dict[str, Any]) -> Dict[str, str]:
        """Process a single historical attachment and return file reference."""
        attachment_keys = list(attachment.keys())
        attachment_name = attachment.get("name")
        attachment_filename = attachment.get("filename")
        logger.info(f"Processing historical attachment: keys={attachment_keys}, " f"name={attachment_name}, filename={attachment_filename}")

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
        relevant_api_docs = self.get_relevant_api_docs(prompt, user_id)
        prompt_with_docs = f"{prompt}\n\n{relevant_api_docs}"

        # Create current user message with any new file attachments
        current_user_content: List[ContentBlockParam] = [TextBlockParam(type="text", text=PROMPT.format(USER_PROMPT=prompt_with_docs))]

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

    @tracer.wrap()
    def process_chat_with_attachments(
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

            response = self._process_message(user_id=user_id, messages=messages, message_type=message_type)
            return self._handle_response(response, messages, user_id, message_type)

        except Exception as e:
            logger.error(f"Error in process_chat_with_attachments: {str(e)}", exc_info=True)
            raise

    def _handle_response(self, response: Message, messages: List[MessageParam], user_id: str, message_type: MessageType) -> str | None:
        """Handle the response from the AI model, including tool use."""
        # Handle tool use if present
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

    @tracer.wrap()
    def process_message(
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

            relevant_api_docs = self.get_relevant_api_docs(prompt, user_id)
            prompt_with_docs = f"{prompt}\n\n{relevant_api_docs}"

            # Create user message with file attachments if present
            user_content: List[ContentBlockParam] = [TextBlockParam(type="text", text=PROMPT.format(USER_PROMPT=prompt_with_docs))]

            # Add file attachments with actual content
            if file_references:
                file_blocks = self._create_file_attachment_blocks(file_references, user_id)
                user_content.extend(file_blocks)
                logger.info(
                    "Added file attachments to message",
                    extra={"user_id": user_id, "num_files": len(file_references), "file_ids": [ref["id"] for ref in file_references]},
                )

            user_message: MessageParam = {"role": "user", "content": user_content}

            # Debug log the message structure for PDF debugging
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
                system=self.system_prompt_pd,
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

    @tracer.wrap()
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
