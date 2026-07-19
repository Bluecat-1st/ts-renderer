// imageLoader.ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
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
 * @param charWidth
 * @param charHeight
 * @param charSize
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

export interface BMFont {
  fontImg: LoadedImage,
  chars: Map<number, BMFontChar>,
  common: {
    lineHeight: number
  }
}
interface BMFontChar {
  id: number,
  x: number,
  y: number,
  width: number,
  height: number,
  xadvance: number,
  xoffset: number,
  yoffset: number
}

export async function loadFont(filePath: string):Promise<BMFont>{
  interface BMFontJSON {
    pages: string[],
    chars: BMFontChar[],
    common: {
      lineHeight: number
    }
  }
  const file = path.normalize(filePath);
  const fileRoot = file.split(path.sep).slice(0,-1).join(path.sep);

  const font = {
    common:{}
  } as BMFont;
  const text = await readFile(file,{encoding:'utf8'});
  const json = JSON.parse(text) as BMFontJSON;
  if (typeof json !== 'object') throw new TypeError(`The JSON data for '${filePath}' is not an object.`);
  if (typeof json.common !== 'object') throw new TypeError(`'common' from the JSON data is not an object.`);
  if (!json.common.lineHeight) throw new Error(`Missing 'common.lineHeight' from the JSON data.`);
  font.common.lineHeight = json.common.lineHeight;
  if (!json.pages) throw new Error(`Missing 'pages' from the JSON data.`);
  if (!Array.isArray(json.pages)) throw new TypeError(`'pages' from the JSON data is not an array.`);
  if (json.pages.length !== 1) throw new RangeError(`Can't handle more than one font page.`);
  console.log('Starting image loading');
  const fontImg = loadImage(fileRoot + path.sep + json.pages[0]!);
  if (!json.chars) throw new Error(`Missing 'chars' from the JSON data.`);
  if (!Array.isArray(json.chars)) throw new TypeError(`'chars' from the JSON data is not an array.`);
  font.chars = new Map();
  console.log('Loading chars');
  for (const char of json.chars){
    //console.log(char);
    if (!char.id) throw new Error(`A char is missing it's ID.`);
    if (typeof char.id !== 'number') throw new TypeError(`char[].id is not a number.`);
    if (!char.width && char.width !== 0) throw new Error(`A char is missing it's width.`);
    if (typeof char.width !== 'number') throw new TypeError(`char[].width is not a number.`);
    if (!char.height && char.height !== 0) throw new Error(`A char is missing it's height.`);
    if (typeof char.height !== 'number') throw new TypeError(`char[].height is not a number.`);
    if (!char.x && char.x !== 0) throw new Error(`A char is missing it's x.`);
    if (typeof char.x !== 'number') throw new TypeError(`char[].x is not a number.`);
    if (!char.y && char.y !== 0) throw new Error(`A char is missing it's y.`);
    if (typeof char.y !== 'number') throw new TypeError(`char[].y is not a number.`);
    if (!char.xadvance && char.xadvance !== 0) throw new Error(`A char is missing it's xadvance.`);
    if (typeof char.xadvance !== 'number') throw new TypeError(`char[].xadvance is not a number.`);
    if (!char.xoffset && char.xoffset !== 0) throw new Error(`A char is missing it's xoffset.`);
    if (typeof char.xoffset !== 'number') throw new TypeError(`char[].xoffset is not a number.`);
    if (!char.yoffset && char.yoffset !== 0) throw new Error(`A char is missing it's yoffset.`);
    if (typeof char.yoffset !== 'number') throw new TypeError(`char[].yoffset is not a number.`);

    font.chars.set(char.id,{
      id: char.id,
      width: char.width,
      height: char.height,
      x: char.x,
      y: char.y,
      xadvance: char.xadvance,
      xoffset: char.xoffset,
      yoffset: char.yoffset
    });
    //console.log(`Loaded char ${char.id}`);
  }
  console.log('Waiting on font image.');
  font.fontImg = await fontImg;
  console.log('Font loaded');
  return font;
}