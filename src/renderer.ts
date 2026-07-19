//renderer.ts
import { Color, type ColorRGB } from './Color.js';
import { type LoadedImage, type LoadedFont, type BMFont } from './imageLoader.js';
import { dist, type Point2D } from './Geomerty.js';

const round = Math.round;

function clamp(num:number,min:number,max:number){
    if (num > max){
        return max;
    }else if (num < min){
        return min;
    }else{
        return num;
    }
}

/**
 * Note: All drawing functions use cordinates like a HTML canvas, the Y position goes up the farther down the screen.
 */
export class Renderer {
    private width: number;
    private height: number;
    /** The Uint8ClamedArray the class dirrectly uses. */
    public buffer: Uint8ClampedArray;
    /** A refrence to the raw data of `this.buffer` as a real buffer. */
    public nodeBuffer: Buffer;
    private currentFont: LoadedFont|BMFont|null;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.buffer = new Uint8ClampedArray(width * height * 4);
        this.nodeBuffer = Buffer.from(this.buffer.buffer);
        this.currentFont = null;
    }
    /**
     * Sets a single pixel to a color.
     * @param x - The X position of the pixel set.
     * @param y - The Y position of the pixel set.
     * @param color - The color to set the pixel to.
     */
    public setPixel(x: number, y: number, color: ColorRGB|Color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        const index = (round(y) * this.width + round(x)) * 4;

        this.buffer[index] = color.r;
        this.buffer[index + 1] = color.g;
        this.buffer[index + 2] = color.b;
        this.buffer[index + 3] = 255;
    }
    /**
     * Fills the entire screen with a color.
     * @param color The color to set the screen to.
     */
    public fill(color: ColorRGB|Color){
        //for (let index = 0;index<this.buffer.length;index+=4){
        //    this.buffer[index] = color.r;
        //    this.buffer[index + 1] = color.g;
        //    this.buffer[index + 2] = color.b;
        //    this.buffer[index + 3] = 255;
        //}
        const colorBuf = Buffer.from([color.r, color.g, color.b, 255]);
        this.nodeBuffer.fill(colorBuf);
    }
    /**
     * Fills a rectangalar area of the screen.
     * @param x - The top left `X` position of the area.
     * @param y - The top left `Y` position of the area.
     * @param width - The width of the area.
     * @param height - The height of the area.
     * @param color - The color of the area.
     */
    public rect(x: number, y: number, width: number, height: number, color: ColorRGB|Color) {
        if (x < 0) {
            width += x;
            x = 0;
        }
        if (y < 0) {
            height += y;
            y = 0;
        }
        
        const endX = Math.min(x + width, this.width);
        const endY = Math.min(y + height, this.height);

        if (endX <= x || endY <= y) return;
        
        for (let j = y; j < endY; j++) {
            const rowOffset = j * this.width;
            for (let i = x; i < endX; i++) {
                const index = (rowOffset + i) * 4;
                this.buffer[index] = color.r;
                this.buffer[index + 1] = color.g;
                this.buffer[index + 2] = color.b;
            }
        }
    }
    /**
     * Updates the renderer's internal size. Run when the screen being rendered to resizes.
     * @param newWidth - The new width to use for drawing.
     * @param newHeight - The new height to use for drawing.
     */
    public resize(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.buffer = new Uint8ClampedArray(newWidth*newHeight*4);
        this.nodeBuffer = Buffer.from(this.buffer.buffer);
    }
    /**
     * In terpilates between 2 colors.
     * @param colorA - The color to interpilate from.
     * @param colorB - The color to interpilate to.
     * @param a - How far to interpilate from `colorA` to `colorB`. From 0 to 1. (The range is **not** enforced, so any values of `a` out of range can produce problematic results.)
     * @returns The interpilated color.
     */
    public interpilateColors(colorA: ColorRGB|Color, colorB: ColorRGB|Color, a: number): ColorRGB{
        return Color.lerp(colorA,colorB,a);
    }
    /**
     * Gets a color from the screen. (Note: The bounds are **not** range protected, so it can return the fallback color *black* `rgb(0,0,0)`, or an unexpected color on the screen.)
     * @param x The `X` of the pixel to get.
     * @param y The `Y` of the pixel to get.
     * @returns The extracted color.
     */
    public getColor(x: number, y: number): ColorRGB{
        const index = (y * this.width + x) * 4;
        return {r:this.buffer[index]||0,g:this.buffer[index+1]||0,b:this.buffer[index+2]||0};
    }
    /**
     * Draws part of an image to the screen, supports alpha (Transparesy).
     * @param img - The image to draw from.
     * @param destX - The `X` position of the top left corner of the drawn image.
     * @param destY - The `Y` position of the top left corner of the drawn image.
     * @param srcX - The `X` position of the top left corner to draw the image part from.
     * @param srcY - The `Y` position of the top left corner to draw the image part from.
     * @param srcWidth - The width of the image part to draw from.
     * @param srcHeight - The height of the image part to draw from.
     */
    public drawImagePartial(
        img: LoadedImage, 
        destX: number,
        destY: number, 
        srcX: number,
        srcY: number, 
        srcWidth: number,
        srcHeight: number
    ) {
        for (let y = 0; y < srcHeight; y++) {
            const screenY = destY + y;
            const imageY = srcY + y;

            // Boundary checks
            if (screenY < 0 || screenY >= this.height) continue;
            if (imageY < 0 || imageY >= img.height) continue;

            const imgRowOffset = imageY * img.width;
            const screenRowOffset = screenY * this.width;

            for (let x = 0; x < srcWidth; x++) {
                const screenX = destX + x;
                const imageX = srcX + x;

                if (screenX < 0 || screenX >= this.width) continue;
                if (imageX < 0 || imageX >= img.width) continue;

                const imgIndex = (imgRowOffset + imageX) * 4;
                const alphaByte = img.pixels[imgIndex + 3];

                // 🏎️ Skip fully transparent background pixels instantly
                if (alphaByte === 0) continue;

                const screenIndex = (screenRowOffset + screenX) * 4;

                this.buffer[screenIndex]     = img.pixels[imgIndex]||0;     // R
                this.buffer[screenIndex + 1] = img.pixels[imgIndex + 1]||0; // G
                this.buffer[screenIndex + 2] = img.pixels[imgIndex + 2]||0; // B                 // A
            }
        }
    }
    
    /**
     * Draws an image to the screen, supports alpha.
     * @param img - The image to draw.
     * @param destX - The top left `X` postion of the drawn image.
     * @param destY - The top left `Y` postion of the drawn image.
     */
    public drawImage(img: LoadedImage, destX: number, destY: number) {
        // Just pass the full width and height starting at (0,0)
        this.drawImagePartial(img, destX, destY, 0, 0, img.width, img.height);
    }
    /**
     * Sets the font to use to drawing text/charaters. Recremended to use with imageLoader.ts#loadImageAsFont().
     * @param newFont - The new font to use.
     */
    public setFont(newFont:LoadedFont|BMFont){
        this.currentFont = newFont;
    }
    /**
     * Gets the current font used.
     * @returns The current font **if** set, otherwise `null`.
     */
    public getFont():LoadedFont|BMFont|null{
        if (this.currentFont){
            return this.currentFont;
        }
        return null;
    }
    /**
     * Check if a font is loaded, use this if the font used to loaded asynciusly.
     * @returns `true` if the a font is loaded.
     */
    public fontLoaded():boolean{
        return this.currentFont!==null;
    }
    /**
     * Draws a single charater on screen, use `this.drawText()` to draw text.
     * @param charIndex - The ASCII char index of the charater to use.
     * @param x - The `X` postion of the top left corner of the charater.
     * @param y - The `Y` postion of the top left corner of the charater.
     * @throws Throws an error if a font is not loaded.
     */
    public drawChar(charIndex:number,x:number,y:number):{width:number,height:number}{
        if (!this.currentFont){
            throw new Error('No font is loaded for use.');
        }
        if ('img' in this.currentFont){
            const {charWidth, charHeight, charSize, img} = this.currentFont;
            const charX = (charIndex%charWidth)*charSize;
            const charY = Math.floor(charIndex/charHeight)*charSize;
            this.drawImagePartial(img,x,y,charX,charY,charSize,charSize);
            return {width:charWidth,height:charHeight};
        }else{
            const char = this.currentFont.chars.get(charIndex);
            if (!char) return {width:0,height:0};
            this.drawImagePartial(this.currentFont.fontImg,x+char.xoffset,y+char.yoffset,char.x,char.y,char.width,char.height);
            return {width:char.xadvance,height:char.height};
        }
    }
    /**
     * Draws text on screen.
     * @param text - The text to draw.
     * @param x - The `X` postion of the top left corner of the text.
     * @param y - The `Y` postion of the top left corner of the text.
     * @throws Throws an error if a font is not loaded.
     */
    public drawText(text:string,x:number,y:number){
        if (!this.currentFont){
            throw new Error('No font is loaded for use.');
        }
        let currentX = x;
        let currentY = y;
        for (let i=0;i<text.length;i++){
            if (text[i] === '\n'){
                currentY += ('img' in this.currentFont)?this.currentFont.charSize:this.currentFont.common.lineHeight;
                currentX = x;
                continue;
            }
            const size = this.drawChar(text.charCodeAt(i),currentX,currentY);
            currentX += size.width;
        }
    }
    /**
     * Measures the size of text.
     * @param text - The text to measure.
     * @returns An object with the `width` and `height` of the text.
     */
    public measureText(text:string):{width:number,height:number}{
        if (!this.currentFont){
            throw new Error('No font is loaded for use.')
        }
        let currentWidth = 0;
        let currentHeight = 0;
        let lineWidth = 0;
        for (const char of text){
            if (char === '\n'){
                currentHeight += ('img' in this.currentFont)?this.currentFont.charSize:this.currentFont.common.lineHeight;
                if (lineWidth > currentWidth){
                    currentWidth = lineWidth;
                }
                lineWidth = 0;
                continue;
            }
            if ('img' in this.currentFont){
                lineWidth += this.currentFont.charSize;
            }else{
                const c = this.currentFont.chars.get(char.charCodeAt(0))
                if (c){
                    lineWidth += c.xadvance;
                }
            }
        }
        if (currentWidth < lineWidth){
            currentWidth = lineWidth;
        }
        currentHeight += ('img' in this.currentFont)?this.currentFont.charSize:this.currentFont.common.lineHeight;
        return {width:currentWidth,height:currentHeight};
    }
    /**
     * Draws a triangle on the screen. Order does not matter.
     * @param p1 - Point 1 of the triangle.
     * @param p2 - Point 2 of the triangle.
     * @param p3 - Point 3 of the triangle.
     * @param color - The color of the triangle.
     */
    public drawTriangle(p1: Point2D, p2: Point2D, p3: Point2D, color: ColorRGB|Color) {
        const points = [p1, p2, p3].sort((a, b) => a.y - b.y) as [Point2D, Point2D, Point2D];
        const [pTop, pMid, pBot] = points;
        // Fast check: If the entire triangle is a flat horizontal line, skip it
        if (pTop.y === pBot.y) return;
        // --- TOP HALF RENDERING (From pTop.y to pMid.y) ---
        for (let currentY = pTop.y; currentY < pMid.y; currentY++) {
            // Find the interpolation percentage for both edges
            const pct1 = (currentY - pTop.y) / (pMid.y - pTop.y);
            const pct2 = (currentY - pTop.y) / (pBot.y - pTop.y); // Long edge
            // Interpolate the X values directly without slope/intercept equations
            let x1 = pTop.x + (pMid.x - pTop.x) * pct1;
            let x2 = pTop.x + (pBot.x - pTop.x) * pct2;
            if (x1 > x2) { const temp = x1; x1 = x2; x2 = temp; }
            // Draw horizontal pixel span
            for (let x = Math.floor(x1); x < Math.floor(x2); x++) {
                this.setPixel(x, currentY, color);
            }
        }
        // --- BOTTOM HALF RENDERING (From pMid.y to pBot.y) ---
        for (let currentY = pMid.y; currentY < pBot.y; currentY++) {
            const pct1 = (currentY - pMid.y) / (pBot.y - pMid.y);
            const pct2 = (currentY - pTop.y) / (pBot.y - pTop.y); // Still the long edge!
            let x1 = pMid.x + (pBot.x - pMid.x) * pct1;
            let x2 = pTop.x + (pBot.x - pTop.x) * pct2;
            if (x1 > x2) { const temp = x1; x1 = x2; x2 = temp; }
            for (let x = Math.floor(x1); x < Math.floor(x2); x++) {
                this.setPixel(x, currentY, color);
            }
        }
    }
    private _fillCircle(x:number,y:number,radius:number,color:Color|ColorRGB){
        if (radius <= 0) return;

        const x1 = clamp(x-radius,0,this.width);
        const x2 = clamp(x+radius,0,this.width);
        const y1 = clamp(y-radius,0,this.height);
        const y2 = clamp(y+radius,0,this.height);

        if (x1 === x2) return;
        if (y1 === y2) return;

        for (let j=y1;j<y2;j++){
            const rowOffset = j*this.width;
            for (let i=x1;i<x2;i++){
                if (dist(i,j,x,y) < radius){
                    const index = (rowOffset + i) * 4;
                    this.buffer[index] = color.r;
                    this.buffer[index + 1] = color.g;
                    this.buffer[index + 2] = color.b;
                }
            }
        }
    }
    /**
     * Draws a filled circle on screen.
     * @param x - The `x` positon of the circle's center.
     * @param y - The `y` positon of the circle's center.
     * @param radius - The circle's radius.
     * @param color - The circle's color.
     */
    fillCircle(x:number,y:number,radius:number,color:Color|ColorRGB):void;
    /**
     * Draws a filled circle on screen.
     * @param pos - The position of the circle's center.
     * @param radius - The circle's radius.
     * @param color - The circle's color.
     */
    fillCircle(pos:Point2D,radius:number,color:Color|ColorRGB):void;
    public fillCircle(a:number|Point2D,b:number,c:number|Color|ColorRGB,d?:Color|ColorRGB){
        if (typeof a === 'number'){
            this._fillCircle(a,b,c as number,d!);
        }else{
            this._fillCircle(a.x,a.y,b,c as Color|ColorRGB);
        }
    }
    
}