
This is a simple 2D renderer made in TypeScript that works in a `RGBA32` format.

# Example Code
Note: This script may change as the project gets reworked
```typescript
import { Renderer } from "ts-renderer";
import { Colors } from "ts-renderer/dist/Color";
import { exportFrameToPNG } from "ts-renderer/dist/mediaExporter"

const width = 400;
const height = 400;

const screen = new Renderer(width,height);

screen.fill(Colors.black);

screen.rect(10,10,100,100,Colors.red);
screen.fillCircle(200,200,50,Colors.blue);

exportFrameToPNG(screen.buffer,width,height,'image.png');
```