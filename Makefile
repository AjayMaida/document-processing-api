.PHONY: run test lint format migrate worker

run:
	uv run uvicorn app.main:app --reload

worker:
	uv run celery -A app.core.celery_app worker --loglevel=info

test:
	uv run pytest

lint:
	uv run ruff check .

format:
	uv run ruff format .

migrate:
	uv run alembic upgrade head
