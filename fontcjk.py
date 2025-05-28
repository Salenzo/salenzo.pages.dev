import lzma
import numpy as np
from PIL import Image, ImageDraw, ImageFont

image = []
# https://unifoundry.com/pub/unifont/unifont-16.0.03/font-builds/unifont-16.0.03.pcf.gz
font = ImageFont.truetype("unifont.pcf", 16)

for codepoint in range(0x4E00, 0xA000):
    img = Image.new("RGB", (16, 16), (0, 0, 0))
    ImageDraw.Draw(img).text((0, 0), chr(codepoint), font=font, fill=(1, 1, 1))
    img = np.transpose(np.array(img)[:, :, 1])
    img = np.concatenate([img[:, :7:-1], img[:, :8]])
    image.append(img)

with lzma.open("fontcjk.bin.lzma", "wb", format=lzma.FORMAT_ALONE, preset=5) as f:
    f.write(np.packbits(np.concatenate(image)).tobytes())
