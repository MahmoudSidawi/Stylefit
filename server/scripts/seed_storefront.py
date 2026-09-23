"""One-time storefront content import. Runtime pages read only Supabase."""
from pathlib import Path
import sys
import httpx

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'server'))
from app.core.config import settings


def main():
    key = settings.supabase_secret_key.get_secret_value()
    base = settings.supabase_url.rstrip('/')
    with httpx.Client(base_url=base, timeout=45, headers={'apikey': key, 'Authorization': 'Bearer ' + key}) as client:
        data = {
            'title': 'Spring Architecture', 'subtitle': 'Editorial Capsule No. 04',
            'description': 'Sharp tailoring softens into fluid drape. Discover clothes, shoes and hats for a wardrobe that feels entirely your own.',
            'hero_alt': 'Editorial model in a terracotta tailored suit',
            'detail_alt': 'Ivory fabric with buttons and delicate stitching',
            'editorial_title': 'Tension between human instinct & mathematical beauty.',
            'editorial_description': 'This collection explores the meeting of sculptural tailoring and soft, intuitive dressing: a little structure, a little freedom.',
        }
        for field, filename in [('hero_image', 'hero'), ('detail_image', 'silk-detail'),
                                ('curator_image', 'curator'), ('atelier_image', 'atelier'), ('tailoring_image', 'tailoring')]:
            object_key = f'editorial/{filename}.jpg'
            response = client.post('/storage/v1/object/products/' + object_key,
                                   content=(ROOT / f'client/src/assets/storefront/{filename}.jpg').read_bytes(),
                                   headers={'Content-Type': 'image/jpeg', 'x-upsert': 'true'})
            if response.is_error:
                raise RuntimeError(f'Image upload failed ({response.status_code})')
            data[field] = base + '/storage/v1/object/public/products/' + object_key
        response = client.post('/rest/v1/site_content', json={'key': 'storefront', 'data': data},
                               headers={'Prefer': 'resolution=ignore-duplicates'})
        if response.is_error:
            raise RuntimeError(f'Content import failed ({response.status_code}); apply the content migration first.')
        print('Storefront content and five images saved in Supabase. Existing content edits are preserved.')


if __name__ == '__main__':
    main()
