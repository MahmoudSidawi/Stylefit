from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.shop import Input, Category, Kind, KINDS


class StoreSelection(Input):
    source: Literal['store']
    variant_id: UUID


class WardrobeSelection(Input):
    source: Literal['wardrobe']
    wardrobe_item_id: UUID


Selection = Annotated[StoreSelection | WardrobeSelection, Field(discriminator='source')]


class MatchRequest(Input):
    items: list[Selection] = Field(min_length=2, max_length=5)
    occasion: Literal['work', 'weekend', 'evening'] = 'weekend'
    include_profile: bool = False
    include_history: bool = False
    include_recommendations: bool = False

    @model_validator(mode='after')
    def unique_items(self):
        ids = [(item.source, str(item.variant_id if isinstance(item, StoreSelection) else item.wardrobe_item_id)) for item in self.items]
        if len(set(ids)) != len(ids):
            raise ValueError('Choose distinct garments.')
        return self


class Dimension(Input):
    score: int = Field(ge=0, le=100, strict=True)
    explanation: str = Field(min_length=5, max_length=1000)


class SuggestedCandidate(Input):
    candidate_id: UUID
    reason: str = Field(min_length=5, max_length=500)


class MatchAnalysis(Input):
    score: int = Field(ge=0, le=100, strict=True)
    explanation: str = Field(min_length=10, max_length=2000)
    colors: Dimension
    styles: Dimension
    patterns: Dimension
    clothing_types: Dimension
    occasion: Dimension
    suggestions: list[Annotated[str, Field(min_length=3, max_length=500)]] = Field(max_length=4)
    personalization_note: str = Field(default='', max_length=1000)
    recommended_items: list[SuggestedCandidate] = Field(default_factory=list, max_length=3)


class ClothingRecommendation(Input):
    variant_id: str
    product_id: str
    name: str
    image_url: str
    size: str
    color: str
    reason: str


class MatchResponse(MatchAnalysis):
    recommended_items: list[SuggestedCandidate] = Field(default_factory=list, exclude=True)
    provider: Literal['groq'] = 'groq'
    model: str
    used_profile: bool
    images_analyzed: int
    used_history: bool = False
    history_saved_count: int = 0
    history_order_count: int = 0
    recommendations: list[ClothingRecommendation] = Field(default_factory=list)
    disclaimer: str = 'A subjective styling estimate, not a guarantee of garment fit.'


class GarmentAnalysis(Input):
    name: str = Field(min_length=3, max_length=120)
    category_id: Category
    clothing_type: Kind
    color: str = Field(min_length=1, max_length=120)
    style: str = Field(min_length=1, max_length=120)
    pattern: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=10, max_length=1000)
    confidence: Literal['low', 'medium', 'high']

    @model_validator(mode='after')
    def category_matches(self):
        if self.clothing_type not in KINDS[self.category_id]:
            raise ValueError('The suggested type must match its category.')
        return self
