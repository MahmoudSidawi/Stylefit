from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

Category = Literal['tops', 'bottoms', 'dresses']
Kind = Literal['t-shirts', 'shirts', 'hoodies', 'jeans', 'pants', 'shorts', 'skirts', 'dresses']
Text = Annotated[str, Field(min_length=1, max_length=120)]
KINDS = {'tops': ['t-shirts', 'shirts', 'hoodies'],
         'bottoms': ['jeans', 'pants', 'shorts', 'skirts'], 'dresses': ['dresses']}


class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class ProfileUpdate(Input):
    name: Text = Field(default=None)  # May be omitted, but explicit null is invalid.
    height_cm: float | None = Field(None, gt=0, le=300)
    weight_kg: float | None = Field(None, gt=0, le=700)
    body_shape: Text | None = None
    clothing_size: Text | None = None
    skin_tone: Text | None = None

    @model_validator(mode='after')
    def has_changes(self):
        if not self.model_fields_set:
            raise ValueError('Provide at least one profile field to update.')
        return self


class CartUpdate(Input):
    variant_id: UUID
    quantity: int = Field(ge=1, le=99, strict=True)


class CartVariantChange(Input):
    from_variant_id: UUID
    to_variant_id: UUID


class CategoryUpdate(Input):
    name: Text


class WishlistAdd(Input):
    product_id: UUID


class Checkout(Input):
    recipient_name: Text
    phone: str = Field(min_length=7, max_length=30, pattern=r'^\+?[0-9 ()-]+$')
    delivery_address: str = Field(min_length=8, max_length=500)


class OrderUpdate(Input):
    status: Literal['placed', 'shipped', 'delivered', 'cancelled']
    is_paid: bool = False


class WardrobeInput(Input):
    category_id: Category
    name: Text
    # Private bucket object key; never a public image URL.
    image_url: str = Field(min_length=1, max_length=250)
    color: Text | None = None
    clothing_type: Kind | None = None
    style: Text | None = None
    pattern: Text | None = None
    material: Text | None = None
    size: Text | None = None

    @model_validator(mode='after')
    def matching_category(self):
        if self.clothing_type and self.clothing_type not in KINDS[self.category_id]:
            raise ValueError('Clothing type does not belong to this category.')
        return self


class VariantInput(Input):
    size: Text
    color: Text
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    stock_quantity: int = Field(ge=0, le=100000, strict=True)
    image_url: str = Field(min_length=1, max_length=2048, pattern=r'^(https://|/clothes/)')
    is_active: bool = True


class ProductInput(Input):
    name: Text
    category_id: Category
    clothing_type: Kind
    description: str = Field(default='', max_length=3000)
    style: Text = 'casual'
    pattern: Text = 'solid'
    is_active: bool = True

    @model_validator(mode='after')
    def correct_category(self):
        if self.clothing_type not in KINDS[self.category_id]:
            raise ValueError('Clothing type does not belong to the selected category.')
        return self


class ProductCreate(ProductInput):
    variants: list[VariantInput] = Field(min_length=1, max_length=100)

    @model_validator(mode='after')
    def unique_variants(self):
        if len({(v.size, v.color) for v in self.variants}) != len(self.variants):
            raise ValueError('Size and color combinations must be unique.')
        return self
