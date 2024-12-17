sap.ui.define(
    [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "zmmsubcontract/model/models" 
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("zmmsubcontract.Component", {
            metadata: {
                manifest: "json"
            },
        /**
         * The component is initialized by UI5 augrnatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");   
                        
            
            var jQueryScript = document.createElement('script');
            jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/jszip.js');
            document.head.appendChild(jQueryScript);
        
        
            var jQueryScript = document.createElement('script');
            jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/xlsx.js');
            document.head.appendChild(jQueryScript);  
            
                // Add custom styles for carousel sliding
                // sap.ui.getCore().attachInit(function () {
                //     var oStyle = document.createElement("style");
                //     oStyle.type = "text/css";
                //     oStyle.appendChild(document.createTextNode(`
                //         .sapMCrslItem {
                //             animation: slideRight 5s infinite;
                //         }
                //         @keyframes slideRight {
                //             0% {
                //                 transform: translateX(-100%);
                //             }
                //             100% {
                //                 transform: translateX(0);
                //             }
                //         }
                //     `));
                //     document.head.appendChild(oStyle);
                // });
                            
        }            
        });
    }
);