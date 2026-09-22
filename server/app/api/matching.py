from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import Identity, current_user
from app.core.config import settings
from app.schemas.matching import MatchRequest, MatchAnalysis, MatchResponse, GarmentAnalysis
from app.services import database, groq_ai, matching

router = APIRouter(prefix='/api', tags=['Groq AI'])


async def reserve_request(user: Identity):
    allowed = await database.request('POST', 'rest/v1/rpc/reserve_ai_request', user.token)
    if allowed is not True:
        raise HTTPException(429, 'You have reached the AI request limit. Try again in a minute.', headers={'Retry-After': '60'})


@router.post('/matches', response_model=MatchResponse)
async def match_outfit(body: MatchRequest, user: Identity = Depends(current_user)):
    groq_ai.require_configured()
    await reserve_request(user)
    items, images, profile = await matching.selected_items(body, user)
    analysis = await groq_ai.complete(
        'You are StyleFit, a practical clothing stylist. Evaluate ONLY the selected garments as an outfit. '
        'Explain colors, styles, patterns, clothing-type compatibility and the chosen occasion, with a subjective 0-100 score for each '
        'and an overall score. Give up to four actionable suggestions, not invented inventory. '
        'Store products are described by authoritative catalogue attributes; do not claim to have viewed store photos. '
        'Wardrobe images correspond to the numbered image references. Mention uncertainty if clothing is obscured. '
        'Only use supplied optional profile details. Never infer body shape or skin tone from photographs.',
        {'items': items, 'occasion': body.occasion, 'optional_profile': profile}, images, MatchAnalysis)
    return MatchResponse(**analysis.model_dump(), model=settings.groq_model,
                         used_profile=bool(profile), images_analyzed=len(images))


@router.post('/wardrobe/{item_id}/analyze', response_model=GarmentAnalysis)
async def analyze_garment(item_id: UUID, user: Identity = Depends(current_user)):
    groq_ai.require_configured()
    await reserve_request(user)
    record = await matching.wardrobe_record(item_id, user)
    image = await matching.wardrobe_photo(record, user)
    return await groq_ai.complete(
        'Describe the main garment in this photo. Suggest a plain name, basic clothing category/type, color, style, pattern and description. '
        'Tops: t-shirts, shirts, hoodies. Bottoms: jeans, pants, shorts, skirts. Dresses: dresses. '
        'If it is not one of these garments or the photo is unreadable, use confidence low and explain the limitation in description. '
        'Do not guess material composition, brand, measurements, or anything about the wearer. Suggestions are for human review.',
        {'task': 'garment tagging'}, [image], GarmentAnalysis)
