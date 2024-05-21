import json
import logging
from http import HTTPStatus
from typing import Any, Dict, Union

from api.domain.openai_predict import OpenAIPredict
from api.models.chat_request import ChatRequest
from api.models.chat_response import ChatResponse
from api.models.empty_request_error import EmptyRequestError
from api.models.internal_server_error import InternalServerError
from api.settings import Settings

logger = logging.getLogger()


def create_response(status_code: int, body: Any, content_type: str = "application/json") -> Dict[str, Any]:
    return {"statusCode": status_code, "headers": {"Content-Type": content_type}, "body": json.dumps(body)}


def create_chat_completion(event: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("POST /chat/completion", extra={"event": event})
    try:
        if not event.get("body"):
            return create_response(HTTPStatus.BAD_REQUEST, EmptyRequestError(message="Request body is empty").model_dump())

        body: ChatRequest = ChatRequest.model_validate_json(event["body"])
        if body.fake:
            return create_response(HTTPStatus.OK, ChatResponse(reply="Fake response", fake=body.fake).model_dump())

        settings: Settings = Settings.build()
        openai: OpenAIPredict = OpenAIPredict(settings=settings)
        response: Union[str, None] = openai.predict(prompt=body.messag, chat_completion_message_params=body.history)

        if response is None or response == "":
            return create_response(HTTPStatus.NO_CONTENT, ChatResponse(reply="No response was generated", fake=body.fake).model_dump())

        return create_response(HTTPStatus.OK, ChatResponse(reply=response, fake=body.fake).model_dump())

    except Exception as e:
        logger.exception("Error processing request", extra={"error": str(e)})
        return create_response(HTTPStatus.INTERNAL_SERVER_ERROR, InternalServerError(exception_object=e).model_dump())


def get_health(event: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("GET /health", extra={"event": event})
    return create_response(HTTPStatus.OK, {"version": "0.0.1"})


def get_options(event: Dict[str, Any]) -> Dict[str, Any]:
    """These are the CORS headers that are returned when an OPTIONS request is made"""
    # These match the settings in terraform
    allowed_origins = ",".join(["*"])
    allowed_methods = ",".join(["GET", "POST", "OPTIONS"])
    allowed_headers = ",".join(["content-type", "authorization", "origin", "accept"])
    expose_headers = ",".join(["content-type"])

    cors_headers = {
        "Access-Control-Allow-Origin": allowed_origins,
        "Access-Control-Allow-Methods": allowed_methods,
        "Access-Control-Allow-Headers": allowed_headers,
        "Access-Control-Expose-Headers": expose_headers,
        "Access-Control-Max-Age": "3600",
    }

    return create_response(HTTPStatus.OK, cors_headers)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    settings: Settings = Settings.build()
    raw_path: str = event.get("rawPath", "")
    method: str = event.get("requestContext", {}).get("http", {}).get("method", "")
    logger.info(f"path: {raw_path}, http_method: {method}")
    # the below is not robust, this is to get things working
    # TODO: this should be its own method with unit tests
    if raw_path.lower() == f"/{settings.ENVIRONMENT}/chat/completion" and method.upper() == "POST":
        return create_chat_completion(event)
    elif raw_path == f"/{settings.ENVIRONMENT}/health".lower() and method.upper() == "GET":
        return get_health(event)
    elif method.upper() == "OPTIONS":
        return get_options(event)
    else:
        return create_response(HTTPStatus.NOT_FOUND, {"message": f"path {raw_path} method {method} not found"})
