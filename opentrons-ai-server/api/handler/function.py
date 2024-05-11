from http import HTTPStatus
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, Response, content_types
from aws_lambda_powertools.utilities.data_classes import APIGatewayProxyEventV2
from aws_lambda_powertools.utilities.typing import LambdaContext

from api.domain.openai_predict import OpenAIPredict
from api.models.chat_request import ChatRequest
from api.models.chat_response import ChatResponse
from api.models.empty_request_error import EmptyRequestError
from api.models.internal_server_error import InternalServerError
from api.settings import Settings

# Shared resources of the function
service_name = Settings.get_service_name()
tracer: Tracer = Tracer(service=service_name)
logger: Logger = Logger(service=service_name)
app: APIGatewayHttpResolver = APIGatewayHttpResolver()


# named in the same pattern as openai https://platform.openai.com/docs/api-reference/chat
@app.post("/chat/completion")  # type: ignore[misc]
@tracer.capture_method
def create_chat_completion() -> Response[ChatResponse] | Response[InternalServerError] | Response[EmptyRequestError]:
    logger.info("POST /chat/completion app.current_event", extra=app.current_event)
    try:
        if app.current_event.body is None:
            return Response(
                status_code=HTTPStatus.BAD_REQUEST,
                content_type=content_types.APPLICATION_JSON,
                body=EmptyRequestError(message="Request body is empty"),
            )
        body: ChatRequest = ChatRequest.parse_raw(app.current_event.body)
        if body.fake:
            return Response(
                status_code=HTTPStatus.OK,
                content_type=content_types.APPLICATION_JSON,
                body=ChatResponse(reply="Fake response", fake=body.fake),
            )
        settings: Settings = Settings()
        openai: OpenAIPredict = OpenAIPredict(settings=settings)
        response = openai.predict(prompt=body.message)
        if response is None or response == "":
            return Response(
                status_code=HTTPStatus.NO_CONTENT,
                content_type=content_types.APPLICATION_JSON,
                body=ChatResponse(reply="No response was generated", fake=body.fake),
            )
        return Response(
            status_code=HTTPStatus.OK,
            content_type=content_types.APPLICATION_JSON,
            body=ChatResponse(reply=response, fake=body.fake),
        )
    except Exception as e:
        logger.exception(e)
        return Response(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            content_type=content_types.APPLICATION_JSON,
            body=InternalServerError(exception_object=e),
        )


@app.get("/health")  # type: ignore[misc]
@tracer.capture_method
def get_health() -> Response[Any]:
    logger.info("GET /health app.current_event", extra=app.current_event)
    return Response(status_code=HTTPStatus.OK, content_type=content_types.APPLICATION_JSON, body={"version": "0.0.1"})


def handler(event: APIGatewayProxyEventV2, context: LambdaContext) -> dict[Any, Any]:
    return app.resolve(event, context)
