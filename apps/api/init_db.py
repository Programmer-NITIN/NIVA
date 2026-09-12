"""
NIVA — Supabase Table Initializer
Creates all SQLAlchemy tables (users, consents, financial_twins, recommendations, etc.) in Supabase.
"""

import asyncio
from app.database import engine, Base
import app.models  # Registers all models with Base.metadata


async def init_supabase():
    print("Connecting to Supabase PostgreSQL at db.whtsovqyinheugyqtkdb.supabase.co...")
    try:
        async with engine.begin() as conn:
            print("Creating all NIVA tables in Supabase...")
            await conn.run_sync(Base.metadata.create_all)
        print("SUCCESS: All NIVA tables have been created in Supabase!")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")


if __name__ == "__main__":
    asyncio.run(init_supabase())
