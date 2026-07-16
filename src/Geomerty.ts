/** Calculates the distance between two points. */
export function dist(x1:number,y1:number,x2:number,y2:number){
    return Math.sqrt(((x1-x2)**2)+((y1-y2)**2));
}

export interface Point2D {
    x: number;
    y: number;
}

export class Vec2D {
    x;
    y;
    constructor(x:number,y:number){
        this.x = x;
        this.y = y;
    }
    /**
     * Makes a new Vec2D from a `X` and `Y` position.
     * @param pointOrX - The new point's `X` position.
     * @param y - The new point's `Y` position.
     */
    static from(pointOrX:number,y:number):Vec2D;
    /**
     * Makes a new Vec2D from another point.
     * @param pointOrx - The other point to make a Vec2D from.
     */
    static from(pointOrx:Vec2D|Point2D):Vec2D;
    static from(pointOrX:Vec2D|Point2D|number,y?:number){
        if (typeof pointOrX === 'number'){
            return new Vec2D(pointOrX,y!);
        }else{
            return new Vec2D(pointOrX.x,pointOrX.y);
        }
    }
    /**
     * Sets this point's position.
     * @param pointOrX - The point's new `X` position.
     * @param y - The point's new `Y` position.
     */
    set(pointOrX:number,y:number):void;
    /**
     * Sets this point's position.
     * @param pointOrx - The point position to set to.
     */
    set(pointOrx:Vec2D|Point2D):void;
    set(pointOrX:Vec2D|Point2D|number,y?:number){
        if (typeof pointOrX === 'number'){
            this.x = pointOrX;
            this.y = y!;
        }else{
            this.x = pointOrX.x;
            this.y = pointOrX.y;
        }
    }
    static equals(pointA:Vec2D|Point2D,pointB:Vec2D|Point2D){
        return pointA.x === pointB.x && pointA.y === pointB.y;
    }
    equals(other:Vec2D|Point2D){
        return Vec2D.equals(this,other);
    }
    /**
     * Calculates the distance between two points.
     */
    static dist(pointA:Vec2D|Point2D,pointB:Vec2D|Point2D){
        return dist(pointA.x,pointA.y,pointB.x,pointB.y);
    }
    /**
     * Calculates the distance between two points.
     */
    dist(other:Vec2D|Point2D){
        return dist(this.x,this.y,other.x,other.y);
    }
    static magnitude(point:Vec2D|Point2D){
        return dist(point.x,point.y,0,0);
    }
    magnitude(){
        return Vec2D.magnitude(this);
    }

    static round(point:Vec2D|Point2D){
        return new Vec2D(Math.round(point.x),Math.round(point.y));
    }
    static floor(point:Vec2D|Point2D){
        return new Vec2D(Math.floor(point.x),Math.floor(point.y));
    }
    static ceil(point:Vec2D|Point2D){
        return new Vec2D(Math.ceil(point.x),Math.ceil(point.y));
    }
    round(){
        this.set(Vec2D.round(this));
    }
    rounded(){
        return Vec2D.round(this);
    }
    floor(){
        this.set(Vec2D.floor(this));
    }
    floored(){
        return Vec2D.floor(this);
    }
    ceil(){
        this.set(Vec2D.ceil(this));
    }
    ceiled(){
        return Vec2D.ceil(this);
    }

    /** Returns a new point that is the sum of two points. */
    static add(pointA:Vec2D|Point2D,pointB:Vec2D|Point2D){
        return new Vec2D(pointA.x+pointB.x,pointA.y+pointB.y);
    }
    /**
     * Add to the point's position.
     * @param x - The amount to add to the point's `X` position.
     * @param y - The amount to add to the point's `Y` position.
     */
    add(x:number,y:number):Vec2D;
    /**
     * Add to the point's position.
     * @param point - The point to add to the point's position.
     */
    add(point:Vec2D|Point2D):Vec2D;
    add(pointOrX:Vec2D|Point2D|number,y?:number){
        if (typeof pointOrX === 'number'){
            this.x += pointOrX;
            this.y += y!;
        }else{
            this.x += pointOrX.x;
            this.y += pointOrX.y;
        }
        return this;
    }

    // I'm not adding a JSDoc tag for a reason...
    static sub(pointA:Vec2D|Point2D,pointB:Vec2D|Point2D){
        return new Vec2D(pointA.x-pointB.x,pointA.y-pointB.y);
    }
    /**
     * Subtract from the point's position.
     * @param poinyOrX - The amount to subtract from the point's `X` position.
     * @param y - The amount to subtract from the point's `Y` position.
     */
    sub(x:number,y:number):Vec2D;
    /**
     * Subtract from the point's position.
     * @param pointOrX - The point to subtract from the point's position.
     */
    sub(point:Vec2D|Point2D):Vec2D;
    sub(pointOrX:Vec2D|Point2D|number,y?:number){
        if (typeof pointOrX === 'number'){
            this.x -= pointOrX;
            this.y -= y!;
        }else{
            this.x -= pointOrX.x;
            this.y -= pointOrX.y;
        }
        return this;
    }

    static scale(point:Vec2D|Point2D,scale:number){
        return new Vec2D(point.x*scale,point.y*scale);
    }
    scale(scale:number){
        this.x*=scale;
        this.y*=scale;
    }
    scaled(scale:number){
        return Vec2D.scale(this,scale);
    }

    static normal(point:Vec2D|Point2D){
        const len = Vec2D.magnitude(point);
        if (len === 0){
            return new Vec2D(0,0);
        }
        return new Vec2D(point.x/len,point.y/len);
    }
    normalize(){
        const len = Vec2D.magnitude(this);
        if (len === 0){
            this.set(0,0);
        }else{
            this.set(this.x/len,this.y/len);
        }
    }
    normalized(){
        return Vec2D.normal(this);
    }

    // I have no clue what a dot is or what it is for...
    static dot(pointA:Vec2D|Point2D,pointB:Vec2D|Point2D){
        return pointA.x * pointB.x + pointA.y * pointB.y;
    }
    dot(other:Vec2D|Point2D){
        return Vec2D.dot(this,other);
    }

    // I'm leaving a Point2D as an option in case someone wants to use this as a copy function.
    static toPoint2D(point:Vec2D|Point2D):Point2D{
        return {
            x:point.x,
            y:point.y
        };
    }
    toPoint2D(){
        return Vec2D.toPoint2D(this);
    }
    static toString(point:Vec2D|Point2D,precision?:number){
        return `(${point.x.toFixed(precision)},${point.y.toFixed(precision)})`;
    }
    toString(precision?:number){
        return Vec2D.toString(this,precision);
    }
}