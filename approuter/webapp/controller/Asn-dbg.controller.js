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

            this.getView().byId("ETA").setValue(""); // Clear ETA input field
            this.getView().byId("mySelect").setSelectedKey(""); // Clear the selected key
            this.getView().byId("DCNO").setValue("");
            this.getView().byId("DCDATE").setValue("");
            this.getView().byId("PACKS").setValue("");
            this.getView().byId("LRNO").setValue("");
            this.getView().byId("LRDATE").setValue("");
            this.getView().byId("TNAME").setValue("");
            this.getView().byId("VEHNO").setValue("");
            this.getView().byId("SVENDOR").setValue("");
        },

        onToggleButtonPress: async function (oEvent) {
            debugger;
            var aErrors = [];
            var oToggleButton = oEvent.getSource();
            var bPressed = oToggleButton.getPressed();

            // if (bPressed) {
                var inputs = {
                    sDcno: this.byId("DCNO").getValue(),
                    sDcdate: this.byId("DCDATE").getValue(),
                    sPacks: String(this.byId("PACKS").getValue()),
                    sLrno: this.byId("LRNO").getValue(),
                    sLrdate: this.byId("LRDATE").getValue(),
                    sTname: this.byId("TNAME").getValue(),
                    sVehno: this.byId("VEHNO").getValue(),
                    sBtype: this.sSelectedKey,
                    sEta: this.byId("ETA").getValue(),
                };

                var aFilters = [];
                if (inputs.sVehno) {
                    var oFilter = new sap.ui.model.Filter("VehNo", sap.ui.model.FilterOperator.EQ, inputs.sVehno);  // Assuming "Vehno" is the field name in your entity set
                    aFilters.push(oFilter);
                }

                // Read data from the OData service
                // var oModel = this.getOwnerComponent().getModel();
                var oModel = this.getOwnerComponent().getModel("poservice");
                var that = this;

                oModel.read("/VehicleNumberSet", {
                    filters: aFilters,
                    success: function (oData, response) {
                        // Perform validation on the response
                        if (oData.results.length === 1) {
                            MessageBox.error(oData.results[0].Message);
                            return; // Exit if the vehicle number is not valid
                        }

                        // 2. If the vehicle number is valid, proceed with creating the ASN (POST operation)
                        that._createASN(inputs);  // Call the function to create ASN with the valid inputs
                    },
                    error: function (oError) {
                        return;
                    }
                });
            // }
        },

        validateLineItem: function (oSelectedData, index) {
            var asnQty = oSelectedData.Asnqty || 0;
            var blQty = oSelectedData.Blqty || 0;
            var asnWeight = oSelectedData.Asnweight || 0;
            var meins = oSelectedData.Meins;

            // Check if meins is one of the values: "PC", "EA", or "NO"
            if (["PC", "EA", "NO"].includes(meins)) {
                // If asnQty contains decimals, trigger a validation error
                if (asnQty % 1 !== 0) {
                    // Trigger validation error (you can use a message box, dialog, or any other UI feedback mechanism)
                    MessageBox.error("ASN Quantity cannot contain decimal values for the selected unit of measure.");
                    return false; // Prevent further processing or submission if validation fails
                }
            }

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
        },
        
        _createASN: function (inputs) {
            var aErrors = [];
            // Get the DCDATE value and convert it to a Date object
            var dcDate = new Date(inputs.sDcdate);
            var currentDate = new Date();

            // Reset the time of both dates to avoid time discrepancies during comparison
            dcDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);

            // Check if the DCDATE is a future date
            if (dcDate > currentDate) {
                // DCDATE is in the future, show an error message
                MessageBox.error('Invoice date cannot be a future date');
                return;
                // Optionally, set focus back to the DCDATE input field
                this.byId("DCDATE").setValue(""); // Clear the invalid date
                return; // Exit the function if validation fails
            }

            var packs = inputs.sPacks;
            var regex = /^[+-]?\d+$/;
            if (!regex.test(packs)) {
                // If validation fails, show an error message
                MessageBox.error("Please enter a pack number without decimals.");
                return;
            }

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
            var ignoredKeys = ["sLrno", "sLrdate", "sEta", "sTname"];

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
    });
});

