.PHONY: setup teardown install format lint test print

setup:
	uv sync --frozen

teardown:
	rm -rf .venv

install:
	uv install

format:
	uv run ruff format .
	uv run ruff check --fix .

lint:
	uv run ruff check .

test:
	uv run pytest tests/ -v

print:
	uv run python deploy_config.py