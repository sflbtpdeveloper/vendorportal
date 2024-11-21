sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageToast',
    'sap/m/MessageBox'

], function (BaseController, Controller, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("zmmsubcontract.controller.Asn", {

        sSelectedKey: null, // Declare sSelectedKey at the controller level

        formatDateToYYYYMMDD: function (dateStr) {
            var date = new Date(dateStr);
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            var day = String(date.getDate()).padStart(2, '0');
            return `${year}${month}${day}`; // Returns the date in 'yyyymmdd' format
        },

        // formatDateToISO: function (dateStr) {
        //     var date = new Date(dateStr);
        //     var year = date.getFullYear();
        //     var month = String(date.getMonth() + 1).padStart(2, '0');
        //     var day = String(date.getDate()).padStart(2, '0');
        //     var hours = String(date.getHours()).padStart(2, '0');
        //     var minutes = String(date.getMinutes()).padStart(2, '0');
        //     var seconds = String(date.getSeconds()).padStart(2, '0');
        //     return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        // },

        // // Function to convert a date to ISO 8601 duration format
        // convertDateToDuration: function (dateStr) {
        //     // Parse the input date string into a JavaScript Date object
        //     var date = new Date(dateStr);

        //     // Define the reference date (epoch: January 1, 1970)
        //     var epoch = new Date(0);

        //     // Calculate the time difference in milliseconds
        //     var diffMs = date.getTime() - epoch.getTime();

        //     // Convert milliseconds to hours, minutes, seconds
        //     var hours = Math.floor(diffMs / (1000 * 60 * 60));
        //     var minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        //     var seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        //     // Format the duration in ISO 8601 format
        //     var duration = "PT";
        //     if (hours > 0) duration += hours + "H";
        //     if (minutes > 0) duration += minutes + "M";
        //     if (seconds > 0) duration += seconds + "S";
        //     return duration;
        // },

        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            console.log("Asn Controller Initialized");
            this._loadSelectData();

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Asn").attachPatternMatched(this._onRouteMatched, this);
        },
        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("Asn").detachPatternMatched(this._onRouteMatched, this);
            }
        },

        onAfterRendering: function () {
            // Re-attach PatternMatched after rendering
            this.oRouter.getRoute("Asn").attachPatternMatched(this._onRouteMatched, this);
        },

        _loadSelectData: function () {
            debugger;
            var oModel = this.getOwnerComponent().getModel("poservice");
            oModel.refreshMetadata();
            sap.ui.core.BusyIndicator.show(0);
            var that = this;
            // this._userModel = this.getOwnerComponent().getModel("userModel");
            // let sEmail = this._userModel.oData.email

            // let aFilters = [
            //     new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
            // ];
            
            this.fetchPackageType();
            // Read data from the OData service
            // oModel.read("/YMM_SUPPLIER_PO_BAGSet", {
            //     // filters: aFilters,
            //     success: function (oData) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);

            //         // Set the JSON model to the view for the dropdown
            //         that.getView().setModel(oJsonModel, "dropModel");
            //     },
            //     error: function (oErr) {
            //         sap.ui.core.BusyIndicator.hide();
            //         console.error(oErr);
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });
        },

        onSelectChange: function (oEvent) {
            debugger;
            // Get the selected item
            var oSelect = oEvent.getSource();

            // Log the selected item and its key
            var oSelectedItem = oSelect.getSelectedItem();

            this.sSelectedKey = oSelectedItem.getText();
        },

        onChange: function (oEvent) {
            var oInputField = this.byId("SVENDOR");
            oInputField.setVisible(oEvent.getSource().getState());
        },

        _onRouteMatched: function (oEvent) {
            debugger;
            var oDataFromLocalStorage = localStorage.getItem("asnItemsData");
            var oModel;

            if (oDataFromLocalStorage) {
                var oData = JSON.parse(oDataFromLocalStorage);
                oModel = new sap.ui.model.json.JSONModel({ results: oData });
            } else {
                oModel = this.getOwnerComponent().getModel("asnItems");
            }

            this.getView().setModel(oModel, "asnItems");
            this.byId("_IDGenTable1").bindRows({ path: "asnItems>/results" });

            this.byId("ETA").setValue(""); // Clear ETA input field
            this.byId("mySelect").setSelectedKey(""); // Clear the selected key
            this.byId("DCNO").setValue("");
            this.byId("DCDATE").setValue("");
            this.byId("PACKS").setValue("");
            this.byId("LRNO").setValue("");
            this.byId("LRDATE").setValue("");
            this.byId("TNAME").setValue("");
            this.byId("VEHNO").setValue("");
            this.byId("SVENDOR").setValue("");
        },

        onToggleButtonPress: function (oEvent) {
            debugger;
            var aErrors = [];
            var oToggleButton = oEvent.getSource();
            var bPressed = oToggleButton.getPressed();

            if (bPressed) {
                var inputs = {
                    sDcno: this.byId("DCNO").getValue(),
                    sDcdate: this.byId("DCDATE").getValue(),
                    sPacks: this.byId("PACKS").getValue(),
                    sLrno: this.byId("LRNO").getValue(),
                    sLrdate: this.byId("LRDATE").getValue(),
                    sTname: this.byId("TNAME").getValue(),
                    sVehno: this.byId("VEHNO").getValue(),
                    sBtype: this.sSelectedKey,
                    sEta: this.byId("ETA").getValue(),
                };

                // Validate Confirmatory Vendor if switch is on
                if (this.byId("Switch").getState() && !inputs.sLifnr2) {
                    aErrors.push("Confirmatory Vendor is required.");
                }

                // Define a mapping of input keys to their corresponding labels
                var labelMapping = {
                    sDcno: "Invoice Number",
                    sDcdate: "Invoice Date",
                    sPacks: "No Of Packs",
                    sLrno: "LR No",
                    sTname: "Transporter Name",
                    sVehno: "Vehicle Number",
                    sBtype: "Bag Type",
                    // Exclude sLrdate and sEta as they are not required
                };

                // List of keys to ignore
                var ignoredKeys = ["sLrno", "sLrdate", "sEta"];

                // Validate required fields
                for (var key in inputs) {
                    if (inputs.hasOwnProperty(key) && !ignoredKeys.includes(key)) {
                        if (!inputs[key]) {
                            var label = labelMapping[key] || key;
                            aErrors.push(label + " is required.");
                        }
                    }
                }

                // Show error message if there are validation errors
                if (aErrors.length > 0) {
                    MessageBox.error(aErrors.join("\n"));
                    return;
                }

                // Prepare data for the ODataModel
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/");
                var aContexts = this.byId("_IDGenTable1").getBinding("rows").getContexts();

                // Prepare HeaderToItem array
                var aHeaderToItem = [];
                for (var i = 0; i < aContexts.length; i++) {
                    var oSelectedData = aContexts[i].getObject();
                    if (!this.validateLineItem(oSelectedData, i)) return; // Validate each line item
                    aHeaderToItem.push(this.prepareItemData(oSelectedData));
                }

                var Lrdate = inputs.sLrdate ? this.formatDateToYYYYMMDD(inputs.sLrdate) : "";
                var Eta = inputs.sEta ? this.formatDateToYYYYMMDD(inputs.sEta) : "";

                // Prepare header data
                var oHeaderData = {
                    Ebeln: "",
                    Dcno: inputs.sDcno,
                    Dcdate: this.formatDateToYYYYMMDD(inputs.sDcdate),
                    Packs: inputs.sPacks,
                    Lrno: inputs.sLrno,
                    Lrdate: Lrdate,//this.formatDateToYYYYMMDD(inputs.sLrdate),
                    Tname: inputs.sTname,
                    Vehno: inputs.sVehno,
                    Btype: inputs.sBtype,
                    Eta: Eta,//this.formatDateToYYYYMMDD(inputs.sEta),
                    Lifnr2: inputs.sLifnr2,
                    HeaderToItem: aHeaderToItem
                };

                // Perform the deep create operation
                this.createODataEntry(oDataModel, oHeaderData);
            }
        },
        validateLineItem: function (oSelectedData, index) {
            var asnQty = oSelectedData.Asnqty || 0;
            var blQty = oSelectedData.Blqty || 0;
            var asnWeight = oSelectedData.Asnweight || 0;

            if (!asnQty || isNaN(asnQty) || asnQty <= 0) {
                MessageBox.error("Please Enter ASN Quantity for line item " + (index + 1) + ".");
                return false;
            }
            if (!asnWeight || isNaN(asnWeight) || asnWeight <= 0) {
                MessageBox.error("Please Enter ASN Weight for line item " + (index + 1) + ".");
                return false;
            }
            if (asnQty > blQty) {
                MessageBox.error("ASN Quantity must not be greater than BL Quantity for line item " + (index + 1) + ".");
                return false;
            }
            return true;
        },
        prepareItemData: function (oData) {

            return {
                Werks: oData.Werks || "",
                Lifnr: oData.Lifnr || "",
                Ebeln: oData.Ebeln || "",
                Ebelp: oData.Ebelp || "",
                Etenr: oData.Etenr || "",
                Matnr: oData.Matnr || "",
                Maktx: oData.Maktx || "",
                Meins: oData.Meins || "",
                Eindt: this.formatDateToYYYYMMDD(oData.Eindt) || "",
                Menge: oData.Menge || "",
                Wemng: oData.Wemng || "",
                Blqty: oData.Blqty || "",
                Netpr: oData.Netpr || "",
                Peinh: oData.Peinh || "",
                Asnqty: oData.Asnqty || "",
                Asnweight: oData.Asnweight || "",
                Remarks: oData.Remarks || ""
            };
        },
        createODataEntry: function (oDataModel, oHeaderData) {
            debugger;

//ajax call added on 04.11.2024
$.ajax({
    url: "/nodeapp/custom/supasnpost",
    type: "POST",
    contentType: "application/json; charset=UTF-8",
    data: JSON.stringify(oHeaderData),
    headers: {
        // "X-CSRF-Token": csrfToken,
        "Content-Type": "application/json",
    },
    success: function (oData) {                
                debugger;
                var asnNumber = oData.d.Ebeln;
                var oController = this; // Store the reference to 'this'  
                if (asnNumber === "duplicate") { // Replace this condition with your actual logic to determine duplication
                    MessageBox.error("DC number already available in the Financial Year.", { duration: 2000 });
                } else
                    MessageBox.success("ASN Number Created:" + asnNumber, {
                        onClose: function () {
                            debugger;
                            history.go(-1);
                            //    oController.oRouter.navTo("SupAsnCrt", {},false);                            
                        }.bind(this)
                    });
                this.clearInputs();
                // Clear input fields and navigate after a delay
            }.bind(this),
            error: function (oError) {
                // console.error(oError);
                // MessageToast.show("Error creating header and items.");
                MessageBox.error("Error creating entry: " + oError.message);
            }
});
//ajax call added on 04.11.2024
            // var sPath = "/YMM_SUPPLIER_POSet";

            // oDataModel.create(sPath, oHeaderData, {
            //     method: "POST",
            //     success: function (oData) {
            //         var oController = this;
            //         debugger;
            //         var asnNumber = oData.Ebeln;
            //         var oController = this; // Store the reference to 'this'  
            //         if (asnNumber === "duplicate") { // Replace this condition with your actual logic to determine duplication
            //             MessageBox.error("DC number already available in the Financial Year.", { duration: 2000 });
            //         } else
            //             MessageBox.success("ASN Number Created:" + asnNumber, {
            //                 onClose: function () {
            //                     debugger;
            //                     history.go(-1);
            //                     //    oController.oRouter.navTo("SupAsnCrt", {},false);                            
            //                 }.bind(this)
            //             });
            //         this.clearInputs();
            //         // Clear input fields and navigate after a delay



            //     }.bind(this),
            //     error: function (oError) {
            //         // console.error(oError);
            //         // MessageToast.show("Error creating header and items.");
            //         MessageBox.error("Error creating entry: " + oError.message);
            //     }
            // });
        },

        clearInputs: function () {
            this.byId("DCNO").setValue("");
            this.byId("DCDATE").setValue("");
            this.byId("PACKS").setValue("");
            this.byId("LRNO").setValue("");
            this.byId("LRDATE").setValue("");
            this.byId("TNAME").setValue("");
            this.byId("VEHNO").setValue("");
            this.byId("SVENDOR").setValue("");
            this.byId("ETA").setValue("");
            this.byId("mySelect").setSelectedKey(""); // Clear dropdown selection
            this.byId("SVENDOR").setValue("")
        },
        fetchPackageType: async function () {
            debugger;
             const that = this; // Preserve the reference to the controller
 
             sap.ui.core.BusyIndicator.show();
             try {
                 // Make a request to your custom Node.js backend to get the CSRF token and DA list
                 const response = await $.ajax({
                     url: "/nodeapp/packtype",     // Your custom backend route
                     method: "GET",              // Use GET since you're retrieving data         
                     contentType: "application/json"// Send the email as a query parameter
                 });
                 // Success handling
                 sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success
                 
                 // Process the response to get the tokens and DA list                
                 const PackType = response;        // Extract DA list data
                 debugger;
                 // Handle the DA list (e.g., bind to a model or display in a view)
                 const oJsonModel = new sap.ui.model.json.JSONModel(PackType);
                 that.getView().setModel(oJsonModel, "dropModel");                 
 
             } catch (oErr) {
                 sap.ui.core.BusyIndicator.hide();
                 console.error("Error fetching Package Type:", oErr);
                 // If the error response contains a message, display it in the MessageBox
                 const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";
 
                 // Show error message
                 MessageBox.error(errorMessage);
             }
         }        
    });
});

