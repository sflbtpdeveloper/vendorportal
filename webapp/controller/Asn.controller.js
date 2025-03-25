sap.ui.define([
    'zmmsubcontract/controller/BaseController',
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageToast',
    "sap/m/MessageBox",
    'sap/ui/unified/FileUploaderParameter',
    'sap/ui/model/odata/v2/ODataModel'

], function (BaseController, Controller, ODataModel, MessageToast, MessageBox, FileUploaderParameter) {
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

            this.sSelectedKey = null;

            this.getView().byId("ETA").setValue(""); // Clear ETA input field
            // this.getView().getModel("dropModel").setProperty("/selectedKey", ""); // Clear the selected key in the model
            this.getView().byId("mySelect").setSelectedKey(""); // Clear the selected key
            this.getView().byId("DCNO").setValue("");
            this.getView().byId("DCDATE").setValue("");
            this.getView().byId("PACKS").setValue("");
            this.getView().byId("LRNO").setValue("");
            this.getView().byId("LRDATE").setValue("");
            this.getView().byId("TNAME").setValue("");
            this.getView().byId("VEHNO").setValue("");
            this.getView().byId("SVENDOR").setValue("");
            this.getView().byId("invoiceFileName").setText('');
            this.getView().byId("tsFileName").setText('');

            // Get the FileUploader controls by their ID
            var invoiceUploader = this.getView().byId("invoiceAttachment");
            var tsUploader = this.getView().byId("tsAttachment");

            // Reset their values to clear any pre-existing data
            if (invoiceUploader) {
                invoiceUploader.setValue("");
            }
            if (tsUploader) {
                tsUploader.setValue("");
            }

            // Optionally, clear the text controls if used to display file names
            var invoiceFileNameText = this.byId("invoiceFileName");
            if (invoiceFileNameText) {
                invoiceFileNameText.setText("");
            }

            var tsFileNameText = this.byId("tsFileName");
            if (tsFileNameText) {
                tsFileNameText.setText("");
            }

            //code to enable the save button
            const saveButtonModel = new sap.ui.model.json.JSONModel({
                isSaveEnabled: true
            });
            this.getView().setModel(saveButtonModel, "saveButtonModel");
            this.getView().getModel("saveButtonModel").setProperty("/isSaveEnabled", true);

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
                sVehno: this.byId("VEHNO").getValue().replace(/\s+/g, ''),
                sBtype: this.sSelectedKey,
                sEta: this.byId("ETA").getValue(),
            };

            if (!inputs.sLrdate) {
                // Set a dummy date (e.g., "1970-01-01" or any other valid date)
                inputs.sLrdate = new Date(0);  // This represents "1970-01-01T00:00:00.000Z"
                // console.log("Using dummy date:", sLrdate);
            }

            var aFilters = [];
            if (inputs.sVehno) {
                var oFilter = new sap.ui.model.Filter("VehNo", sap.ui.model.FilterOperator.EQ, inputs.sVehno);  // Assuming "Vehno" is the field name in your entity set
                aFilters.push(oFilter);
            }

            // Read data from the OData service
            // var oModel = this.getOwnerComponent().getModel();
            var oModel = this.getOwnerComponent().getModel("poservice");
            var that = this;

            that._createASN(inputs);  // Call the function to create ASN with the valid inputs
        },

        validateLineItem: function (oSelectedData, index, dcDate) {
            var asnQty = parseFloat(oSelectedData.Asnqty) || 0;
            var blQty = parseFloat(oSelectedData.Blqty) || 0;
            var asnWeight = oSelectedData.Asnweight || 0;
            var meins = oSelectedData.Meins;
            var invVal = oSelectedData.Invvalue;

            var maxQty = parseFloat(oSelectedData.Max)
            var maxInd = oSelectedData.Maxind;

            //08.01.2025
            var aedat = oSelectedData.Aedat;

            // Convert '20230427' (YYYYMMDD) to a JavaScript Date object
            var year = aedat.substring(0, 4);    // '2023'
            var month = aedat.substring(4, 6);   // '04'
            var day = aedat.substring(6, 8);     // '27'

            // JavaScript months are 0-indexed, so subtract 1 from the month
            var aedat = new Date(year, month - 1, day);

            if (dcDate < aedat) {
                // DCDATE is in the future, show an error message
                sap.m.MessageBox.error('DC date is Prior than PO creation date');
                return;
            }
            //08.01.2025

            if (maxInd === 'X') {
                if (asnQty > maxQty) {
                    sap.m.MessageBox.error("Quantity exceeds maximum stock!");
                    return;
                }
            }

            if (maxInd === 'Y') {
                // if (asnQty > maxQty) {
                sap.m.MessageBox.error("Maximum stock level not available for material");
                return;
                // }
            }

            // Check if meins is one of the values: "PC", "EA", or "NO"
            if (["PC", "EA", "NO"].includes(meins)) {
                // If asnQty contains decimals, trigger a validation error
                if (asnQty % 1 !== 0) {
                    // Trigger validation error (you can use a message box, dialog, or any other UI feedback mechanism)
                    sap.m.MessageBox.error("ASN Quantity cannot contain decimal values for the selected unit of measure.");
                    return false; // Prevent further processing or submission if validation fails
                }
            }

            if (!invVal) {
                sap.m.MessageBox.error("Please Enter Invoice Value for line item " + (index + 1) + ".");
                return false; // Stop further execution
            }

            if (!asnQty || isNaN(asnQty) || asnQty <= 0) {
                sap.m.MessageBox.error("Please Enter ASN Quantity for line item " + (index + 1) + ".");
                return false;
            }

            if (!asnWeight || isNaN(asnWeight) || asnWeight <= 0) {
                sap.m.MessageBox.error("Please Enter ASN Weight for line item " + (index + 1) + ".");
                return false;
            }

            if (asnQty > blQty) {
                sap.m.MessageBox.error("ASN Quantity must not be greater than BL Quantity for line item " + (index + 1) + ".");
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
                Invvalue: oData.Invvalue || "",
                Remarks: oData.Remarks || ""
            };
        },

        createODataEntry: function (oDataModel, oHeaderData) {
            debugger;
            // AJAX call added on 04.11.2024
            $.ajax({
                url: "/nodeapp/custom/supasnpost",
                type: "POST",
                contentType: "application/json; charset=UTF-8",
                data: JSON.stringify(oHeaderData),
                headers: {
                    "Content-Type": "application/json",
                },
                success: async function (oData) {
                    debugger;
                    const asnNumber = oData.d.Ebeln;

                    if (asnNumber === "duplicate") {
                        sap.m.MessageBox.error("DC number already available in the Financial Year.", { duration: 2000 });
                        return;
                    }


                    // // Ensure 'this' refers to the controller
                    await this.uploadAttachments(asnNumber);

                    // Show success message after attachments are uploaded
                    sap.m.MessageBox.show("ASN Number Created: " + asnNumber, {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function () {
                            debugger;
                            const oLocalModel = this.getView().getModel("local");
                            oLocalModel.setData({
                                attachData: {
                                    mimetype: "",
                                    InvoiceFileName: "",
                                    InvoiceFileBase64: "",
                                    TsFileName: "",
                                    TsFileBase64: ""
                                }
                            });

                            history.go(-1);
                        }.bind(this)
                    });

                    // Clear input fields
                    this.clearInputs();
                }.bind(this), // Bind 'this' to the controller
                error: function (oError) {
                    sap.m.MessageBox.error("Error creating entry: " + oError.message);
                }
            });
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
            // this.getView().getModel("dropModel").setProperty("/selectedKey", ""); // Clear the selected key in the model
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
                sap.m.MessageBox.error(errorMessage);
            }
        },

        onDcDateChange: function (oEvent) {
            // Get the DCDATE value and convert it to a Date object
            var oDcDate = oEvent.getSource();
            // var sdc = this.byId("DCDATE").getValue();
            var sdc = oDcDate.getValue();
            var dcDate = new Date(sdc);
            var currentDate = new Date();

            // Reset the time of both dates to avoid time discrepancies during comparison
            dcDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);

            // Check if the DCDATE is a future date
            if (dcDate > currentDate) {
                // DCDATE is in the future, show an error message
                sap.m.MessageBox.error('Invoice date cannot be a future date');
                return;
                // Optionally, set focus back to the DCDATE input field
                this.byId("DCDATE").setValue(""); // Clear the invalid date
                return; // Exit the function if validation fails
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
                sap.m.MessageBox.error('Invoice date cannot be a future date');
                return;
                // Optionally, set focus back to the DCDATE input field
                this.byId("DCDATE").setValue(""); // Clear the invalid date
                return; // Exit the function if validation fails
            }

            var packs = inputs.sPacks;
            var regex = /^[+-]?\d+$/;
            if (!regex.test(packs)) {
                // If validation fails, show an error message
                sap.m.MessageBox.error("Please enter a pack number without decimals.");
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
                sap.m.MessageBox.error(aErrors.join("\n"));
                return;
            }

            // Prepare data for the ODataModel
            var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/");
            var aContexts = this.byId("_IDGenTable1").getBinding("rows").getContexts();

            // Prepare HeaderToItem array
            var aHeaderToItem = [];
            for (var i = 0; i < aContexts.length; i++) {
                var oSelectedData = aContexts[i].getObject();
                if (!this.validateLineItem(oSelectedData, i, dcDate)) return; // Validate each line item
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

        },

        onDCNOValidation: function (oEvent) {
            // Get the input value
            var sValue = oEvent.getParameter("value");

            // Get the Input control to display an error state if needed
            var oInput = oEvent.getSource();

            // Check if the input length is greater than 16
            if (sValue.length > 16) {
                // Set the value state to Error
                oInput.setValueState("Error");
                oInput.setValueStateText("Only 16 characters allowed");
            } else {
                // Reset the value state if the length is valid
                oInput.setValueState("None");
            }
        },

        uploadAttachments: async function (asnNumber) {
            const oLocalModel = this.getView().getModel("local");
            const attachData = oLocalModel.getProperty("/attachData");
            debugger;
            // Configure ODataModel for the AttachmentSet
            const oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/YMM_SUPPLIER_ATT_SRV/");

            // Helper function to refresh CSRF token
            const refreshCsrfToken = () => {
                return new Promise((resolve, reject) => {
                    oDataModel.refreshSecurityToken(
                        () => {
                            const csrfToken = oDataModel.getSecurityToken();
                            if (csrfToken) {
                                resolve(csrfToken);
                            } else {
                                reject(new Error("Failed to retrieve CSRF token."));
                            }
                        },
                        (error) => {
                            reject(new Error("Failed to refresh CSRF token: " + JSON.stringify(error)));
                        }
                    );
                });
            };

            const uploadFile = (fileName, mimeType, filePrefix) => {
                if (!fileName) {
                    return Promise.resolve(); // Skip if no file data
                }

                let concatenatedFileName = `${asnNumber}/`;

                // Concatenate the prefix ('INV' or 'TSC') to the filename
                concatenatedFileName += filePrefix + fileName;

                var oFileUploader;

                if (filePrefix === 'INV') {
                    oFileUploader = this.getView().byId("invoiceAttachment");
                } else if (filePrefix === 'TSC') {
                    oFileUploader = this.getView().byId("tsAttachment");
                }

                if (oFileUploader) {
                    // Clear existing parameters
                    oFileUploader.destroyHeaderParameters();

                    // If the file is selected, proceed with adding the SLUG header and upload logic
                    oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "SLUG",
                        value: concatenatedFileName // Pass the file name as SLUG
                    }));

                    return new Promise(async (resolve, reject) => {
                        try {
                            // Refresh CSRF token before proceeding with file upload
                            const csrfToken = await refreshCsrfToken();

                            oFileUploader.addHeaderParameter(
                                new sap.ui.unified.FileUploaderParameter({
                                    name: "x-csrf-token",
                                    value: csrfToken // Pass CSRF token for secure upload
                                })
                            );

                            // Set the request to send via XHR (for file upload)
                            oFileUploader.setSendXHR(true);

                            // Trigger the file upload
                            oFileUploader.upload(); // This should trigger the file upload

                            // After file upload completes, handle model updates
                            oFileUploader.attachUploadComplete((oUploadCompleteEvent) => {
                                const status = oUploadCompleteEvent.getParameter("status");
                                if (status === 200 || status === 201) {
                                    resolve();
                                } else {
                                    reject(new Error("File upload failed with status: " + status));
                                }
                            });
                        } catch (error) {
                            reject(error); // Handle token refresh or upload errors
                        }
                    });
                }
            };

            // Get FileUploader controls
            const invoiceUploader = this.getView().byId("invoiceAttachment");
            const tsUploader = this.getView().byId("tsAttachment");

            // Upload Invoice Attachment (INV)
            if (attachData.InvoiceFileName) {
                await uploadFile(attachData.InvoiceFileName, attachData.mimetype, 'INV');
            }

            // Upload Test Certificate Attachment (TSC)
            if (attachData.TsFileName) {
                await uploadFile(attachData.TsFileName, attachData.mimetype, 'TSC');
            }

            // Refresh FileUploader controls after upload
            if (invoiceUploader) {
                invoiceUploader.setValue(""); // Reset the value of the FileUploader
            }
            if (tsUploader) {
                tsUploader.setValue(""); // Reset the value of the FileUploader
            }

            // Clear local model properties for file names
            oLocalModel.setProperty("/attachData/InvoiceFileName", "");
            oLocalModel.setProperty("/attachData/TsFileName", "");

            // Clear Text controls (if used to display file names)
            this.byId("invoiceFileName").setText("");
            this.byId("tsFileName").setText("");
        },

        onFileChangedI: function (oEvent) {
            var oFileUploader = oEvent.getSource(); // Get the FileUploader control
            var sFileName = oFileUploader.getValue(); // Get the file name selected by the user
            this.getView().getModel("local").setProperty("/attachData/InvoiceFileName", sFileName);

            // Set the selected file name to the Text control
            var oTextControl = this.byId("invoiceFileName");
            oTextControl.setText(sFileName);
        },

        onFileChangedT: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var sFileName = oFileUploader.getValue();
            this.getView().getModel("local").setProperty("/attachData/TsFileName", sFileName);

            // Set the selected file name to the Text control
            var oTextControl = this.byId("tsFileName");
            oTextControl.setText(sFileName);
        },

        onAsnQtyChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sPath = oInput.getBindingContext("asnItems").getPath();
            var oModel = this.getView().getModel("asnItems");

            // Get the entered ASN Quantity
            var iAsnQty = parseFloat(oInput.getValue()) || 0;

            // Fetch additional required values from the same line item
            var sMaterialType = oModel.getProperty(sPath + "/Mtart");  // Material Type
            var sUoM = oModel.getProperty(sPath + "/Meins");  // Material Type
            var iNetWeight = parseFloat(oModel.getProperty(sPath + "/Ntgew")) || 0; // Net Weight per unit
            var iNetGewei = oModel.getProperty(sPath + "/Gewei");

            // Perform Calculation (Modify logic based on actual business rules)
            var iAsnWeight = 0;
            // Apply the weight calculation logic based on Material Type and Unit of Measure
            if ((sMaterialType === "ROH" || sMaterialType === "HALB") && sUoM === "KG") {
                iAsnWeight = iNetWeight * iAsnQty;
            } else if ((sMaterialType === "ROH" || sMaterialType === "HALB") && sUoM === "PC" && iNetGewei !== "G") {
                iAsnWeight = (iNetWeight / 100) * iAsnQty;
            } else if ((sMaterialType === "ROH" || sMaterialType === "HALB") && sUoM === "PC" && iNetGewei === "G") {
                iAsnWeight = (iNetWeight / 1000) * iAsnQty;
            } else if ((sMaterialType === "ROH" || sMaterialType === "HALB") && sUoM === "TO") {
                iAsnWeight = (iNetWeight * 1000) * iAsnQty;
            } else if ((sMaterialType === "ROH" || sMaterialType === "HALB") && sUoM === "G") {
                iAsnWeight = (iNetWeight / 1000) * iAsnQty;
            } else if (sMaterialType === "FERT" && sUoM === "PC") {
                iAsnWeight = (iNetWeight / 1000) * iAsnQty;
            } else if (sMaterialType === "FERT" && sUoM === "G") {
                iAsnWeight = (iNetWeight / 1000) * iAsnQty;
            } else {
                iAsnWeight = iNetWeight * iAsnQty; // Default case
            }

            // Update the ASN Weight in the model
            oModel.setProperty(sPath + "/Asnweight", iAsnWeight.toFixed(4));
        }
    });
});