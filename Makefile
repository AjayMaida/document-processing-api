.PHONY: run test lint format migrate docker-up docker-down docker-test worker

run:
	uvicorn app.main:app --reload

worker:
	celery -A app.celery_app worker --loglevel=info

test:
	pytest tests/ -v --tb=short

lint:
	ruff check .

format:
	ruff format .

migrate:
	alembic upgrade head

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-test:
	docker compose --profile testing up -d test_db
	pytest tests/ -v --tb=short
	docker compose --profile testing down