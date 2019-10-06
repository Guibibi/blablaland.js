package map
{
    import flash.display.*;

    public class SkyLightning extends MovieClip
    {
        public var lightBitmapData:BitmapData;
        public var shape:Sprite;
        public var frameCount:Number;
        public var flip:Number;
        public var seed:Number;

        public function SkyLightning()
        {
            this.removeChild(this.shape);
            this.frameCount = 0;
            this.flip = 0;
            return;
        }// end function

    }
}
