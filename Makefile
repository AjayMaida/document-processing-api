.PHONY: run test lint format migrate

run:
	uv run uvicorn app.main:app --reload

test:
	uv run pytest

lint:
	uv run ruff check .

format:
	uv run ruff format .

migrate:
	uv run alembic upgrade head
