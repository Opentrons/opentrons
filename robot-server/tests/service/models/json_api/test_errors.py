from functools import reduce

import pytest

from robot_server.service.models.json_api.errors import ErrorResponse


def errors_wrapper(d):
    return {'errors': [d]}


valid_error_objects = [
    {'id': 'abc123'},
    {'status': '404'},
    {'code': '1005'},
    {'title': 'Something went wrong'},
    {'detail': "oh wow, there's a few things we messed up there"},
    {'meta': {'num_errors_today': 10000}},
    {'links': {'self': '/my/error-info?code=1005'}},
    {'source': {'pointer': '/data/attributes/price'}},
]

valid_error_responses = map(errors_wrapper, valid_error_objects)


@pytest.mark.parametrize('error_response', valid_error_responses)
def test_valid_error_response_fields(error_response):
    validated = ErrorResponse(**error_response)
    assert validated.dict(exclude_unset=True) == error_response


error_with_all_fields = reduce(
    lambda acc, d: {**acc, **d}, valid_error_objects, {}
)


def test_error_response_with_all_fields():
    error_response = errors_wrapper(error_with_all_fields)
    validated = ErrorResponse(**error_response)
    assert validated.dict(exclude_unset=True) == error_response


def test_empty_error_response_valid():
    error_response = {'errors': []}
    validated = ErrorResponse(**error_response)
    assert validated.dict(exclude_unset=True) == error_response
