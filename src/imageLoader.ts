// imageLoader.ts
import sharp from 'sharp';

export interface LoadedImage {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}
export interface LoadedFont {
    img: LoadedImage;
    charWidth: number;
    charHeight: number;
    charStart: number;
    charSize: number;
    fontName: string | undefined;
}

/**
 * Loads an image in RGBA format.
 * @param filePath - The path to load the file from.
 * @returns An image that can be drawn. (After the Promise resolves)
 */
export async function loadImage(filePath: string): Promise<LoadedImage> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data.buffer);

  return {
    width: info.width,
    height: info.height,
    pixels
  };
}

/**
 * Loads an image with metadata needed for renderer.ts#renderer.setFont().
 * @param filePath - The path to the bitmap font to use.
 * @param charWidth - The colums of the charater sheet
 * @param charHeight - The rows of the charater sheet
 * @param charSize - The size of the charaters in px.
 * @param charStart - The ASCII code the font starts at.
 * @param fontName - **UNUSED** | The name of the font.
 * @returns The font with the fully loaded image after the Promise resolves.
 */
export async function loadImageAsFont(filePath: string, charWidth: number, charHeight: number,charSize:number, charStart: number | undefined, fontName: string | undefined): Promise<LoadedFont>{
    return loadImage(filePath).then((data)=>{
        charStart = charStart || 0;
        fontName = fontName || filePath;
        let newFont: LoadedFont =  {
          img:data,
          charWidth,
          charHeight,
          charSize,
          charStart,
          fontName
        };
        return newFont;
    });
}