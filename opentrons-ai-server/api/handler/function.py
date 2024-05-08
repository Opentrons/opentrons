from http import HTTPStatus
from typing import Any

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, Response, content_types
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from api.domain.todo import retrieve_todos
from api.models.todo import Todos
from api.settings import Settings

settings: Settings = Settings()
tracer: Tracer = Tracer(service=settings.service_name)
logger: Logger = Logger(service=settings.service_name)
app: APIGatewayHttpResolver = APIGatewayHttpResolver()


@app.get("/todos")  # type: ignore[misc]
@tracer.capture_method
def get_todos() -> Response[Todos] | Response[dict[str, str]]:
    logger.info("GET todos")
    logger.info(app.current_event)
    try:
        todos: Todos = retrieve_todos()
        if len(todos) == 0:
            return Response(status_code=HTTPStatus.NOT_FOUND, content_type=content_types.APPLICATION_JSON, body=todos)
        return Response(status_code=HTTPStatus.FOUND, content_type=content_types.APPLICATION_JSON, body=todos)
    except Exception as e:
        logger.exception(e)
        return Response(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            content_type=content_types.APPLICATION_JSON,
            body={"error": str(e), "message": "An error occurred while retrieving todos"},
        )


@app.get("/health")  # type: ignore[misc]
@tracer.capture_method
def get_health() -> Response[Any]:
    logger.info("GET health")
    return Response(status_code=HTTPStatus.OK, content_type=content_types.APPLICATION_JSON, body={"version": "0.0.1"})


# You can continue to use other utilities just as before
@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP, log_event=True)
@tracer.capture_lambda_handler
def handler(event: dict[Any, Any], context: LambdaContext) -> dict[Any, Any]:
    return app.resolve(event, context)
