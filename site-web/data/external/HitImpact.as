package 
{
    import flash.display.*;

    dynamic public class HitImpact extends MovieClip
    {

        public function HitImpact()
        {
            addFrameScript(8, this.frame9);
            return;
        }// end function

        function frame9()
        {
            stop();
            if (parent)
            {
                parent.removeChild(this);
            }
            return;
        }// end function

    }
}
