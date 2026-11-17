"""Convert downloaded catalog photos to responsive WebP assets (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageOps

directory = Path(__file__).resolve().parents[1] / 'public' / 'images' / 'products'
for source in sorted(directory.glob('*.jpg')):
    with Image.open(source) as original:
        photo = ImageOps.exif_transpose(original).convert('RGB')
        for size in (320, 640):
            image = ImageOps.contain(photo, (size, size), Image.Resampling.LANCZOS)
            canvas = Image.new('RGB', (size, size), 'white')
            canvas.paste(image, ((size - image.width) // 2, (size - image.height) // 2))
            target = directory / f'{source.stem}-{size}.webp'
            canvas.save(target, 'WEBP', quality=78, method=6)
            print(f'{target.name}: {target.stat().st_size / 1024:.1f} KB')
    # Only remove the specific successfully converted source file.
    source.unlink()
