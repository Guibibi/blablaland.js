package engine
{

    public class Srandom extends Object
    {
        public var seed:Number;
        private static var exp:Number = Math.pow(2, 48) - 1;

        public function Srandom()
        {
            this.seed = new Date().getTime() * Math.PI % 1;
            return;
        }// end function

        public function generate(param1:Number = 1) : Number
        {
            var _loc_2:uint = 0;
            var _loc_3:String = null;
            _loc_2 = 0;
            while (_loc_2 < param1)
            {
                
                while (Math.round(this.seed * 100).toString().length < 2 && this.seed != 0)
                {
                    
                    this.seed = this.seed * 10;
                }
                _loc_3 = Math.round(Math.pow(this.seed * 100000, 2)).toString();
                this.seed = Number(_loc_3.substr(1, (_loc_3.length - 1))) % exp;
                _loc_2 = _loc_2 + 1;
            }
            _loc_2 = 0;
            while (_loc_2 < param1)
            {
                
                this.seed = (31167285 * this.seed + 1) % exp;
                _loc_2 = _loc_2 + 1;
            }
            this.seed = this.seed / exp;
            return this.seed;
        }// end function

    }
}
