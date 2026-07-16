// mediaExporter.ts
import { Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

/**
 * Converts a BGRA buffer to RGBA and saves it as a PNG file
 */
export async function exportFrameToPNG(
    //bgraBuffer: Uint8ClampedArray,
    rgbaBuffer: Uint8ClampedArray, 
    width: number, 
    height: number, 
    outputPath: string
): Promise<void> {
    await sharp(rgbaBuffer, {
        raw: {
            width,
            height,
            channels: 4
        }
    })
    .png()
    .toFile(outputPath);
}

export class VideoExporter {
    private _width: number;
    private _height: number;
    private _fps: number;
    private stream: Readable;
    private command: ffmpeg.FfmpegCommand;
    private _streamOpen = false;
    private _streamProcessing = true;
    private framesSubmitted = 0;
    private currentRecordingFPS: number;
    private estimatedFileSize: number;
    private currentSavedTime: string;
    private framesSaved: number;
    public currentProgressPercent = 0;

    /**
     * Starts an FFmpag instance to start recording to a video. Use `this.appendFrame()` to record a frame.
     * @param width - Width of the stream
     * @param height - Height of the stream
     * @param fps - The output FPS of the video
     * @param outputPath - The name of the outputed video (Ex:`'video.mp4'`)
     * @param onStart - An action to run when FFmpeg is ready for the stream to start (You can also use `this.streamOpen`). The sent frames may be lost otherwise.
     * @param onEnd - An action to run the FFmpeg finishes saving the video, you can also use `this.streamProcessing`.
     */
    constructor(width: number, height: number, fps: number, outputPath: string,onStart:()=>void, onEnd?:()=>void) {
        this._width = width;
        this._height = height;
        this._fps = fps;
        this.currentRecordingFPS = 0;
        this.estimatedFileSize = 0;
        this.framesSaved = 0;
        this.currentSavedTime = "00:00:00";

        this.stream = new Readable({
            read() {}
        });
        this.command = ffmpeg(this.stream)
            // Group all incoming raw video parameters together so FFmpeg reads them instantly
            .inputOptions([
                '-f rawvideo',      // Force input format to raw video bytes
                '-pix_fmt rgba',    // Tell it the bytes are arranged in RGBA channels
                `-s ${width}x${height}`, // Provide the exact width and height dimensions
                `-r ${fps}`         // Define the input framerate
            ])
            
            // Output configurations (These happen safely AFTER the input parameters)
            .outputFps(fps)
            .videoCodec('libx264')
            .outputOptions([
                '-pix_fmt yuv420p', 
                '-crf 18'
            ])
            .output(outputPath);
        // Event handling
        this.command.on('start',() => {
            this._streamOpen = true;
            onStart();
        })
        this.command.on('error', (err) => {
            this._streamOpen = false;
            console.error('FFmpeg Video Export Error:', err)
        });
        this.command.on('end', () => {
            this._streamOpen = false;
            this._streamProcessing = false;
            console.log(`Video successfully exported to: ${outputPath}`);
            if (onEnd){onEnd();}
        });
        this.command.on('progress', (progress) => {
            if (this.framesSubmitted > 0) {
                // Calculate percentage based on frames processed vs frames submitted
                const rawPercent = (progress.frames / this.framesSubmitted) * 100;
                // Clamp it between 0 and 100 to prevent weird numbers
                this.currentProgressPercent = Math.min(100, Math.max(0, Math.floor(rawPercent)));
                this.currentRecordingFPS = progress.currentFps;
                this.estimatedFileSize = progress.targetSize;
                this.currentSavedTime = progress.timemark;
                this.framesSaved = progress.frames;
            }
        });
        
        this.command.run();
    }

    /**
     * Adds a frame into the queue for FFmpeg to process.
     * @param bgraBuffer - An Uint8ClampedArray containing the color data in BGRA format.
     */
    public appendFrame(bgraBuffer: Uint8ClampedArray) {
        this.framesSubmitted++;
        // 1. Allocate a fresh, independent chunk of raw binary memory
        // allocUnsafe is lightning fast because it skips zero-filling the memory
        const frameClone = Buffer.allocUnsafe(bgraBuffer.byteLength);
        // 2. Perform a deep, hardware-level copy of the pixels into our new clone
        // We wrap bgraBuffer temporarily just to use Node's ultra-fast .copy()
        Buffer.from(bgraBuffer.buffer, bgraBuffer.byteOffset, bgraBuffer.byteLength).copy(frameClone);
        // 3. Push the isolated clone into the stream queue
        this.stream.push(frameClone);
    }

    /**
     * Closes the stream, pushing frames afterward will cause FFmpeg to through an error. Use `this.streamOpen` to check if the stream can be pushed to.
     */
    public finalize() {
        this._streamOpen = false;
        this.stream.push(null);
    }

    /**
     * `true` if the video can have frames pushed to.
     */
    public get streamOpen(){
        return this._streamOpen;
    }
    /**
     * `true` if the video is still processing.
     */
    public get streamProcessing(){
        return this._streamProcessing;
    }
    /**
     * The number of frames pushed to the recorder.
     */
    public get recordedFrames(){
        return this.framesSubmitted;
    }
    /**
     * The number of frames that have been saved.
     */
    public get savedFrames(){
        return this.framesSaved;
    }
    /**
     * The current FPS the recorder is saving the frames.
     */
    public get recordingFPS(){
        return this.currentRecordingFPS;
    }
    /**
     * It *should* be the estimated file size.
     * @deprecated This does not seem to work for some reason.
     */
    public get estimatedSize(){
        return this.estimatedFileSize;
    }
    /**
     * A string showing the time that is currently being saved. (Ex: `'00:12:43.16'`)
     */
    public get savingTime(){
        return this.currentSavedTime;
    }
    /** Get the FPS of the output file */
    public get fps(){
        return this._fps;
    }
    public get width(){
        return this._width;
    }
    public get height(){
        return this._height;
    }
}