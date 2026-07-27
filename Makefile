.PHONY: run test lint format migrate

run:
	uvicorn app.main:app --reload

test:
	pytest

lint:
	ruff check .

format:
	ruff format .

migrate:
	alembic upgrade head