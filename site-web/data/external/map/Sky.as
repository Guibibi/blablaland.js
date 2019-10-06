package map
{
    import engine.*;
    import flash.display.*;
    import flash.events.*;
    import flash.geom.*;
    import flash.media.*;

    public class Sky extends MovieClip
    {
        public var mapWidth:Number;
        public var mapHeight:Number;
        public var skyQuality:Number;
        public var nbStars:Number;
        public var skyColorMatrix:Array;
        public var serverId:uint;
        public var dayTime:Number;
        public var cloudDensity:Number;
        public var stormy:Number;
        private var skyBitmapData:BitmapData;
        private var skyBitmapContent:Bitmap;
        private var skyDisplayContent:Sprite;
        private var starDisplayContent:Bitmap;
        private var lightningDisplayContent:Sprite;
        private var lightningRandom:Srandom;
        private var lightningList:Array;
        private var cloudBitmapData:BitmapData;
        private var cloudBitmapDataSRC:BitmapData;
        private var cloudBitmapContent:Bitmap;
        private var cloudDisplayContent:Sprite;
        public var sun:MovieClip;
        public var moon:MovieClip;
        static var noiseMap:BitmapData = null;

        public function Sky()
        {
            this.dayTime = 0.4;
            this.cloudDensity = 0.1;
            this.stormy = 0;
            this.lightningRandom = new Srandom();
            this.lightningList = new Array();
            addEventListener(Event.ENTER_FRAME, this.lightningEnterFrame, false, 0, true);
            addEventListener("updateLightning", this.lightningEnterFrame, false, 0, true);
            this.skyQuality = 4;
            this.mapWidth = 750;
            this.mapHeight = 425;
            this.nbStars = 300;
            this.starDisplayContent = new Bitmap();
            addChildAt(this.starDisplayContent, 0);
            this.skyDisplayContent = new Sprite();
            this.skyBitmapContent = new Bitmap();
            this.skyDisplayContent.addChild(this.skyBitmapContent);
            addChildAt(this.skyDisplayContent, 0);
            this.cloudDisplayContent = new Sprite();
            this.cloudBitmapContent = new Bitmap();
            this.cloudDisplayContent.addChild(this.cloudBitmapContent);
            addChild(this.cloudDisplayContent);
            this.lightningDisplayContent = new Sprite();
            addChild(this.lightningDisplayContent);
            return;
        }// end function

        public function dispose()
        {
            this.cloudBitmapData.dispose();
            this.cloudBitmapDataSRC.dispose();
            if (this.starDisplayContent.bitmapData)
            {
                this.starDisplayContent.bitmapData.dispose();
            }
            return;
        }// end function

        public function reset()
        {
            var _loc_1:uint = 0;
            var _loc_2:Matrix = null;
            var _loc_3:Matrix = null;
            var _loc_4:Matrix = null;
            var _loc_10:* = undefined;
            var _loc_11:* = undefined;
            this.skyColorMatrix = this.getDefaultSkyColorMatrix();
            if (this.skyBitmapData)
            {
                this.skyBitmapData.dispose();
            }
            this.skyBitmapData = new BitmapData(1, Math.ceil(this.mapHeight / this.skyQuality), false, 0);
            this.skyBitmapContent.bitmapData = this.skyBitmapData;
            this.skyDisplayContent.scaleX = this.mapWidth;
            this.skyDisplayContent.scaleY = this.skyQuality;
            if (this.starDisplayContent.bitmapData)
            {
                this.starDisplayContent.bitmapData.dispose();
            }
            this.starDisplayContent.bitmapData = new BitmapData(this.mapWidth, this.mapHeight, true, 0);
            var _loc_5:* = new SkyStar();
            _loc_1 = 0;
            while (_loc_1 < this.nbStars)
            {
                
                _loc_5.gotoAndStop((Math.round((_loc_5.totalFrames - 1) * Math.random()) + 1));
                _loc_2 = new Matrix();
                _loc_2.translate(Math.random() * (this.mapWidth + _loc_5.width * 2) - _loc_5.width, Math.random() * (this.mapHeight + _loc_5.height * 2) - _loc_5.height);
                this.starDisplayContent.bitmapData.draw(_loc_5, _loc_2);
                _loc_1 = _loc_1 + 1;
            }
            if (this.cloudBitmapData)
            {
                this.cloudBitmapData.dispose();
            }
            if (this.cloudBitmapDataSRC)
            {
                this.cloudBitmapDataSRC.dispose();
            }
            if (noiseMap === null)
            {
                noiseMap = new BitmapData(this.mapWidth, 1000, false, 0);
                noiseMap.perlinNoise(182, 51, 6, 100, true, true, 1, true, null);
            }
            var _loc_6:* = new BitmapData(this.mapWidth, noiseMap.height, false, 0);
            this.cloudBitmapData = new BitmapData(this.mapWidth, this.mapHeight, true, 0);
            this.cloudBitmapDataSRC = new BitmapData(this.mapWidth, this.mapHeight, false, 0);
            var _loc_7:Number = 5;
            var _loc_8:Number = 0;
            var _loc_9:* = new BitmapData(this.mapWidth, noiseMap.height / _loc_7, false, 0);
            _loc_1 = 0;
            while (_loc_1 < _loc_7)
            {
                
                _loc_10 = new Matrix();
                _loc_10.translate(0, (-_loc_1) * noiseMap.height / _loc_7);
                _loc_9.draw(noiseMap, _loc_10, null, "normal", null, true);
                _loc_11 = 1 - _loc_1 / _loc_7;
                _loc_11 = _loc_11 * 0.9 + 0.1;
                _loc_11 = Math.pow(_loc_11, 2);
                _loc_2 = new Matrix();
                _loc_2.scale(1, _loc_11);
                _loc_3 = new Matrix();
                _loc_3.translate(0, _loc_8);
                _loc_2.concat(_loc_3);
                _loc_8 = _loc_8 + Math.floor(_loc_11 * (noiseMap.height / _loc_7));
                _loc_6.draw(_loc_9, _loc_2, null, "normal", null, true);
                _loc_1 = _loc_1 + 1;
            }
            _loc_4 = new Matrix();
            _loc_4.scale(1, this.mapHeight / _loc_8);
            this.cloudBitmapDataSRC.draw(_loc_6, _loc_4, null, "normal", null, true);
            this.cloudBitmapContent.bitmapData = this.cloudBitmapData;
            _loc_6.dispose();
            _loc_9.dispose();
            return;
        }// end function

        public function lightningTimerRandom(param1:Number)
        {
            var _loc_3:* = undefined;
            var _loc_4:Number = NaN;
            var _loc_5:Number = NaN;
            var _loc_6:Number = NaN;
            var _loc_7:Number = NaN;
            var _loc_8:Number = NaN;
            var _loc_9:Bitmap = null;
            var _loc_10:Matrix = null;
            var _loc_11:Array = null;
            var _loc_12:int = 0;
            var _loc_13:Class = null;
            var _loc_14:Sound = null;
            var _loc_15:SoundChannel = null;
            this.lightningRandom.seed = param1;
            var _loc_2:* = Math.max((this.cloudDensity - 0.7) * (1 / (1 - 0.7)), 0) * Math.pow(this.stormy, 3);
            if (this.lightningRandom.generate(3) < _loc_2 * 0.4)
            {
                _loc_3 = new SkyLightning();
                this.lightningDisplayContent.addChild(_loc_3);
                this.lightningList.push(_loc_3);
                _loc_4 = this.lightningRandom.generate() * this.cloudBitmapData.width;
                _loc_5 = this.lightningRandom.generate() * this.cloudBitmapData.height;
                _loc_6 = Math.pow(1 - _loc_5 / this.cloudBitmapData.height, 2);
                _loc_7 = _loc_6 * 0.5 + 2.5;
                _loc_8 = _loc_6 * 0.8 + 2.5;
                _loc_3.lightBitmapData = new BitmapData(Math.floor(_loc_3.shape.width * _loc_7), Math.floor(_loc_3.shape.height * _loc_8), true, 0);
                _loc_3.lightBitmapData.lock();
                _loc_9 = new Bitmap(_loc_3.lightBitmapData);
                _loc_3.addChild(_loc_9);
                _loc_3.x = _loc_4 - _loc_3.lightBitmapData.width / 2;
                _loc_3.y = _loc_5 - _loc_3.lightBitmapData.height / 2;
                _loc_10 = new Matrix();
                _loc_10.translate(-_loc_3.x, -_loc_3.y);
                _loc_3.lightBitmapData.draw(this.cloudBitmapData, _loc_10);
                _loc_3.lightBitmapData.colorTransform(_loc_3.lightBitmapData.rect, new ColorTransform(1, 1, 1, 1, -100, -100, -100));
                _loc_3.lightBitmapData.colorTransform(_loc_3.lightBitmapData.rect, new ColorTransform(1.2, 1.2, 1.2, 1, 0, 0, 0));
                _loc_10 = new Matrix();
                _loc_10.scale(_loc_7, _loc_8);
                _loc_3.lightBitmapData.draw(_loc_3.shape, _loc_10, null, "erase");
                _loc_3.lightBitmapData.unlock();
                _loc_3.blendMode = "add";
                _loc_3.seed = this.lightningRandom.seed;
                dispatchEvent(new Event("updateLightning"));
            }
            if (this.lightningRandom.generate() < _loc_2 * 0.15)
            {
                _loc_11 = new Array(SkySnd0);
                _loc_12 = Math.round(this.lightningRandom.generate() * (_loc_11.length - 1));
                _loc_13 = _loc_11[_loc_12];
                _loc_14 = new _loc_13;
                _loc_15 = _loc_14.play();
                if (_loc_15)
                {
                    _loc_15.soundTransform = new SoundTransform(0.3 + 0.75 * this.lightningRandom.generate(), this.lightningRandom.generate() - 0.5);
                }
            }
            return;
        }// end function

        public function lightningEnterFrame(event:Event)
        {
            var _loc_3:SkyLightning = null;
            var _loc_4:Number = NaN;
            var _loc_2:* = 0;
            while (_loc_2 < this.lightningList.length)
            {
                
                _loc_3 = this.lightningList[_loc_2];
                if (_loc_3.flip % 3 == 0)
                {
                    this.lightningRandom.seed = _loc_3.seed;
                    _loc_4 = this.lightningRandom.generate();
                    _loc_3.seed = this.lightningRandom.seed;
                    _loc_3.alpha = _loc_4 + 0.3;
                    if (_loc_4 * 50 < _loc_3.frameCount)
                    {
                        _loc_3.lightBitmapData.dispose();
                        this.lightningDisplayContent.removeChild(_loc_3);
                        this.lightningList.splice(_loc_2, 1);
                        _loc_2 = _loc_2 - 1;
                    }
                    var _loc_5:* = _loc_3;
                    var _loc_6:* = _loc_3.frameCount + 1;
                    _loc_5.frameCount = _loc_6;
                }
                _loc_2 = _loc_2 + 1;
            }
            return;
        }// end function

        public function updateAstro()
        {
            var _loc_1:* = (this.dayTime + 0.75) % 1;
            var _loc_2:* = Math.sin((this.dayTime * 2 - 1) * Math.PI);
            var _loc_3:* = _loc_2 * (this.mapWidth / 2 - 20);
            this.moon.x = -_loc_3 + this.mapWidth / 2;
            this.sun.x = _loc_3 + this.mapWidth / 2;
            var _loc_4:* = Math.cos((Math.pow(this.dayTime, 1.08) * 2 - 1) * Math.PI);
            var _loc_5:* = Math.cos((Math.pow(this.dayTime, 1.08) * 2 - 1) * Math.PI) * (this.mapHeight + this.sun.height / 2);
            this.moon.y = _loc_5 + this.mapHeight + this.sun.height;
            this.sun.y = -_loc_5 + this.mapHeight + this.sun.height;
            var _loc_6:* = _loc_1 * 2 % 1;
            var _loc_7:* = 1 - Math.pow(_loc_6 <= 0.5 ? (1 - _loc_6) : (_loc_6), 4);
            _loc_7 = (1 - Math.pow(_loc_6 <= 0.5 ? (1 - _loc_6) : (_loc_6), 4)) * 0.7 + 0.3;
            var _loc_8:* = new ColorTransform();
            new ColorTransform().blueMultiplier = _loc_7;
            _loc_8.greenMultiplier = _loc_7;
            this.sun.transform.colorTransform = _loc_8;
            return;
        }// end function

        public function getDefaultSkyColorMatrix() : Array
        {
            if (this.serverId == 1)
            {
                return [0, 90, 0, 255, 110, 255, 0, 0, 0, 255, 120, 0];
            }
            if (this.serverId == 2)
            {
                return [150, 50, 0, 100, 10, 0, 0, 0, 0, 0, 0, 100];
            }
            return [80, 150, 0, 0, 0, 185, 0, 0, 70, 180, 0, 0];
        }// end function

        public function updateSky()
        {
            var _loc_5:Number = NaN;
            var _loc_6:Number = NaN;
            var _loc_7:Number = NaN;
            var _loc_8:Number = NaN;
            var _loc_9:Number = NaN;
            var _loc_10:* = undefined;
            var _loc_1:* = (this.dayTime + 0.75) % 1;
            var _loc_2:* = Math.pow(Math.sin(this.dayTime * Math.PI), 2);
            this.skyBitmapData.lock();
            var _loc_3:* = Math.ceil(this.mapHeight / this.skyQuality);
            var _loc_4:* = 0;
            while (_loc_4 < _loc_3)
            {
                
                _loc_5 = _loc_4 / (_loc_3 - 1);
                _loc_6 = _loc_5 * this.skyColorMatrix[0] + this.skyColorMatrix[3];
                _loc_7 = _loc_5 * this.skyColorMatrix[1] + this.skyColorMatrix[4];
                _loc_8 = _loc_5 * this.skyColorMatrix[2] + this.skyColorMatrix[5];
                _loc_6 = _loc_6 * _loc_2;
                _loc_7 = _loc_7 * _loc_2;
                _loc_8 = _loc_8 * _loc_2;
                _loc_6 = _loc_6 + this.skyColorMatrix[6];
                _loc_7 = _loc_7 + this.skyColorMatrix[7];
                _loc_8 = _loc_8 + this.skyColorMatrix[8];
                _loc_9 = _loc_1 * 2 % 1;
                _loc_10 = Math.pow(_loc_9 <= 0.5 ? (1 - _loc_9) : (_loc_9), 3);
                _loc_6 = _loc_6 + this.skyColorMatrix[9] * Math.pow(_loc_5, 1.5) * _loc_10;
                _loc_7 = _loc_7 + this.skyColorMatrix[10] * Math.pow(_loc_5, 1.5) * _loc_10;
                _loc_8 = _loc_8 + this.skyColorMatrix[11] * Math.pow(_loc_5, 1.5) * _loc_10;
                this.skyBitmapData.setPixel(0, _loc_4, Math.round(Math.min(_loc_6, 255)) * 65536 + Math.round(Math.min(_loc_7, 255)) * 256 + Math.round(Math.min(_loc_8, 255)));
                _loc_4 = _loc_4 + 1;
            }
            this.skyBitmapData.unlock();
            this.starDisplayContent.alpha = Math.pow(1 - _loc_2, 2) * 0.4;
            return;
        }// end function

        public function updateCloud(param1:Number = 0)
        {
            var _loc_2:* = Math.pow(Math.sin(this.dayTime * Math.PI), 2);
            var _loc_3:Number = 0;
            var _loc_4:* = param1 / 50000000 % 1;
            var _loc_5:* = Math.round(this.cloudBitmapDataSRC.width * _loc_4);
            var _loc_6:* = Math.round(this.cloudBitmapDataSRC.width * (1 - _loc_4));
            var _loc_7:* = new Matrix();
            new Matrix().translate(-_loc_5, 0);
            this.cloudBitmapData.lock();
            this.cloudBitmapData.draw(this.cloudBitmapDataSRC, _loc_7, null, "normal", null, true);
            _loc_7 = new Matrix();
            _loc_7.translate(_loc_6, 0);
            this.cloudBitmapData.draw(this.cloudBitmapDataSRC, _loc_7, null, "normal", null, true);
            this.cloudBitmapData.copyChannel(this.cloudBitmapDataSRC, this.cloudBitmapDataSRC.rect, new Point(-_loc_5, 0), BitmapDataChannel.RED, BitmapDataChannel.ALPHA);
            this.cloudBitmapData.copyChannel(this.cloudBitmapDataSRC, this.cloudBitmapDataSRC.rect, new Point(_loc_6, 0), BitmapDataChannel.RED, BitmapDataChannel.ALPHA);
            _loc_3 = _loc_2 * 0.8 + 0.2;
            var _loc_8:* = new ColorTransform(_loc_3, _loc_3, _loc_3, Math.max(Math.min(0.5 + 0.5 * this.cloudDensity, 1), 0), 0, 0, 0, 0);
            _loc_3 = (1 - (this.stormy * 0.9 + 0.1) * Math.pow(this.cloudDensity, 2) * 1.6) * 80 + 30;
            var _loc_9:* = new ColorTransform(1, 1, 1, 1, _loc_3, _loc_3, _loc_3, 0);
            var _loc_10:* = new ColorTransform(1, 1, 1, 6, 100, 100, 100, 0);
            var _loc_11:* = new ColorTransform(0.2, 0.2, 0.2, 1, 0, 0, 0, 120 * (Math.pow(this.cloudDensity, 0.8) * 2 - 1) - 90);
            _loc_10.concat(_loc_11);
            _loc_9.concat(_loc_10);
            _loc_8.concat(_loc_9);
            var _loc_12:* = this.cloudDisplayContent.transform;
            this.cloudDisplayContent.transform.colorTransform = _loc_8;
            this.cloudDisplayContent.transform = _loc_12;
            this.cloudBitmapData.unlock();
            return;
        }// end function

    }
}
