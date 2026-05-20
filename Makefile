.PHONY: env up upd down logs

env:
	cp .env.example .env

up:
	docker compose up --build

upd:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f
