"""Small, orientation-correct display assets with preserved transparency."""
from io import BytesIO
from PIL import Image, ImageOps


def display_photo(content: bytes) -> bytes:
    with Image.open(BytesIO(content)) as source:
        image = ImageOps.exif_transpose(source).convert('RGBA')
        # Empty transparent padding makes clothing appear smaller on the body.
        bounds = image.getchannel('A').getbbox()
        if bounds:
            image = image.crop(bounds)
        image.thumbnail((720, 720), Image.Resampling.LANCZOS)
        output = BytesIO()
        image.save(output, 'WEBP', quality=82, method=6)
        return output.getvalue()
