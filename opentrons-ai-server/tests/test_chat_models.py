import pytest
from api.models.chat_request import ChatRequest
from api.models.chat_response import ChatResponse
from pydantic import ValidationError


@pytest.mark.unit
def test_chat_request_model() -> None:
    # Test valid data
    request_data = {"message": "Hello", "chat_history": [], "fake": False}
    request = ChatRequest(**request_data)
    assert request.message == "Hello"
    assert request.fake is False

    # Test invalid data
    with pytest.raises(ValidationError):
        invalid_request_data = {"message": 123, "fake": "true"}
        ChatRequest(**invalid_request_data)


@pytest.mark.unit
def test_chat_response_model() -> None:
    # Test valid data
    response_data = {"reply": "Hi", "fake": True}
    response = ChatResponse(**response_data)
    assert response.reply == "Hi"
    assert response.fake is True

    # Test invalid data
    with pytest.raises(ValidationError):
        invalid_response_data = {"reply": 123, "history": "history", "fake": "false"}
        ChatResponse(**invalid_response_data)
