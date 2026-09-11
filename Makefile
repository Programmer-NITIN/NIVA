.PHONY: setup dev seed reset stop db api web

# === First-time setup ===
setup:
	cp -n .env.example .env || true
	docker compose up -d
	cd apps/api && pip install -r requirements.txt
	cd apps/web && npm install
	@echo "✅ Setup complete. Run 'make dev' to start."

# === Start everything ===
dev:
	docker compose up -d
	@echo "🐘 PostgreSQL on :5432  |  🔴 Redis on :6379"
	@echo "Starting API and Web servers..."
	@make -j2 api web

api:
	cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:
	cd apps/web && npm run dev

# === Database ===
db:
	docker compose up -d postgres redis

seed:
	cd apps/api && python -m scripts.seed_demo

migrate:
	cd apps/api && alembic upgrade head

reset:
	docker compose down -v
	docker compose up -d
	sleep 3
	cd apps/api && alembic upgrade head
	cd apps/api && python -m scripts.seed_demo
	@echo "✅ Database reset and seeded."

# === Stop ===
stop:
	docker compose down
