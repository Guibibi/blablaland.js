package 
{
    import bbl.*;

    public class external extends ExternalSecurity
    {
        public var bulleFont:Class;
        public var pseudoFont:Class;

        public function external()
        {
            addFrameScript(0, this.frame1);
            this.bulleFont = FontClassVerdana;
            this.pseudoFont = FontClassVerdana;
            return;
        }// end function

        function frame1()
        {
            return;
        }// end function

    }
}
