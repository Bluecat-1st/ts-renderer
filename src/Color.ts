import { colord } from "colord";

export interface ColorRGB {
    /** The color's `red` value. */
    r: number;
    /** The color's `green` value. */
    g: number;
    /** The color's `blue` value. */
    b: number;
    /** The color's `alpha` value. */
    a?: number;
}

/**
 * A utility color class.
 */
export class Color {
    protected _r;
    protected _g;
    protected _b;
    protected _a;
    constructor(r:number,g:number,b:number,a = 255){
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a;
        this.clamp();
    }
    /**
     * Constrains the color's `R`, `G`, `B`, and `A` values to valid amounts.
     * 
     * This is done on most operations.
     */
    clamp(){
        if (this._r > 255){
            this._r = 255;
        }else if (this._r < 0){
            this._r = 0;
        }
        if (this._g > 255){
            this._g = 255;
        }else if (this._g < 0){
            this._g = 0;
        }
        if (this._b > 255){
            this._b = 255;
        }else if (this._b < 0){
            this._b = 0;
        }
        if (this._a > 255){
            this._a = 255;
        }else if (this._a < 0){
            this._a = 0;
        }
    }
    set r(red:number){
        if (red > 255){
            this._r = 255;
        }else if (red < 0){
            this._r = 0;
        }else{
            this._r = red;
        }
    }
    set g(green:number){
        if (green > 255){
            this._g = 255;
        }else if (green < 0){
            this._g = 0;
        }else{
            this._g = green;
        }
    }
    set b(blue:number){
        if (blue > 255){
            this._b = 255;
        }else if (blue < 0){
            this._b = 0;
        }else{
            this._b = blue;
        }
    }
    set a(alpha:number){
        if (alpha > 255){
            this._a = 255;
        }else if (alpha < 0){
            this._a = 0;
        }else{
            this._a = alpha;
        }
    }
    get r(){
        return this._r;
    }
    get g(){
        return this._g;
    }
    get b(){
        return this._b;
    }
    get a(){
        return this._a;
    }
    /**
     * Sets the color's `R`, `G`, `B` and `A` values (The `A` value is left untouched if not supplied).
     * @param r - The color's *red* value.
     * @param g - The color's *green* value.
     * @param b - The color's *blue* value.
     * @param a - The color's *alpha* (Transparecy) value.
     */
    set(r:number,g:number,b:number,a?:number):void;
    /**
     * Sets the color to the one provied.
     * @param color - The color to set to.
     */
    set(color:ColorRGB|Color):void;
    set(rOrColor:number|ColorRGB|Color,g?:number,b?:number,a?:number){
        if (typeof rOrColor === 'number'){
            this._r = rOrColor;
            this._g = g!;
            this._b = b!;
            if (a){
                this._a = a;
            }
        }else{
            this._r = rOrColor.r;
            this._g = rOrColor.g;
            this._b = rOrColor.b;
            if (rOrColor.a){
                this._a = rOrColor.a;
            }
        }
        this.clamp();
    }
    /**
     * Creates a new Color class from another color.
     * @param color - The new color's starting values.
     * @returns - A brand new Color class.
     */
    static from(color:Color|ColorRGB):Color;
    static from(color:string):Color|null;
    static from(color:Color|ColorRGB|String):Color|null{
        if (typeof color === 'string'){
            const newColor = parseColor(color,true);
            return newColor?Color.from(newColor):null;
        }
        return new Color((color as Color).r,(color as Color).g,(color as Color).b);
    }
    toColorRGB():ColorRGB{
        const color:ColorRGB = {
            r:this._r,
            g:this._g,
            b:this._b
        }
        if (this._a !== 255){
            color.a = this._a;
        }
        return color;
    }
    toString():string{
        if (this._a === 255){
            return `rgb(${this._r},${this._g},${this._b})`;
        }else{
            return `rgba(${this._r},${this._g},${this._b},${this._a})`;
        }
    }
    /**
     * Interpilates between 2 colors.
     * @param colorA - The color to interpilate from.
     * @param colorB - The color to interpilate to.
     * @param a - How far to interpilate from `colorA` to `colorB`. From 0 to 1. (The range is **not** enforced, so any values of `a` out of range can produce problematic results.)
     * @returns The interpilated color.
     */
    static lerp(colorA:ColorRGB|Color,colorB:ColorRGB|Color,a:number):Color{
        return new Color(((colorA.r*a)+(colorB.r*(1-a))),((colorA.g*a)+(colorB.g*(1-a))),((colorA.b*a)+(colorB.b*(1-a))));
    }
    /**
     * Interpiletes to a color.
     * @param colorB - The color to interpilate to.
     * @param a - How far to interpilate to `colorB`. From 0 to 1. (The range is **not** enforced, so any values of `a` out of range can produce problematic results.)
     */
    lerp(colorB:ColorRGB|Color,a:number){
        this.set(Color.lerp(this,colorB,a));
    }
}

/** Some predefined colors */
export const Colors = {
    // Grays
    white:new Color(255,255,255),
    lightGray:new Color(200,200,200),
    gray:new Color(150,150,150),
    darkGray:new Color(100,100,100),
    black:new Color(0,0,0),
    // Primaries
    red:new Color(255,0,0),
    green:new Color(0,255,0),
    blue:new Color(0,0,255),
    // Secondaries
    yellow:new Color(255,255,0),
    purple:new Color(255,0,255),
    teal:new Color(0,255,255),
    // Others
}
/**
 * Parses CSS colors into supported colors.
 * @param colorString - A CSS valid color string.
 * @param safe - Set to `true` if the function prints a warning and returns null, otherwise it throws an error if the color is invalid.
 * @returns The parsed color.
 */

export function parseColor(colorString: string, safe: boolean = false): ColorRGB | null {
    const parsed = colord(colorString);
    if (!parsed.isValid()) {
        const msg = `Invalid CSS color format string: '${colorString}'`;
        if (safe) {
            console.warn(`parseColor(): ${msg}`);
            return null;
        }
        throw new Error(msg);
    }
    const { r, g, b } = parsed.toRgb();
    return { r, g, b };
}
