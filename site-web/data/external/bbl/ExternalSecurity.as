package bbl
{
    import flash.display.*;
    import flash.system.*;

    public class ExternalSecurity extends MovieClip
    {
        public static var _securityInit:Object = securityInit();

        public function ExternalSecurity()
        {
            return;
        }// end function

        public static function securityInit()
        {
            Security.allowDomain("*.niveau99.com");
            Security.allowDomain("*.blablaland.com");
            Security.allowDomain("niveau99.com");
            Security.allowDomain("blablaland.com");
            return;
        }// end function

    }
}
