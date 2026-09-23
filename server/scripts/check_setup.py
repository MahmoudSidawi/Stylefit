"""Configuration check. Prints booleans/results, never credentials. --live performs read-only checks."""
import argparse
import asyncio
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx
from app.core.config import settings
from app.services import database, groq_ai


async def check(live: bool):
    report = {'supabase_configured': database.configured(), 'groq_configured': groq_ai.configured(),
              'groq_model': settings.groq_model}
    if live:
        if database.configured():
            try:
                data = await database.request('POST', 'rest/v1/rpc/browse_products', body={'p_limit': 1})
                report['database_catalogue_available'] = isinstance(data, dict) and 'total' in data
                report['product_count'] = data.get('total', 0)
            except Exception:
                report['database_catalogue_available'] = False
        if groq_ai.configured():
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    result = await client.get('https://api.groq.com/openai/v1/models', headers={
                        'Authorization': 'Bearer ' + settings.groq_api_key.get_secret_value()})
                report['groq_model_available'] = result.is_success and any(
                    item['id'] == settings.groq_model for item in result.json().get('data', []))
            except Exception:
                report['groq_model_available'] = False
    print(json.dumps(report, indent=2))
    return 0 if report['supabase_configured'] and report['groq_configured'] and all(
        report.get(key, True) for key in ('database_catalogue_available', 'groq_model_available')) else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--live', action='store_true', help='Check the database catalogue and Groq model availability without running AI inference.')
    args = parser.parse_args()
    raise SystemExit(asyncio.run(check(args.live)))
