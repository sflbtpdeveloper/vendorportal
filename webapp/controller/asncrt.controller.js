sap.ui.define([
    'zmmsubcontract/controller/BaseController', 'sap/m/MessageBox',
    'sap/m/MessageToast',
    'zmmsubcontract/model/formatter'

], function (BaseController, MessageBox, MessageToast, formatter) {

    return BaseController.extend("zmmsubcontract.controller.asncrt", {
        formatter: formatter,

        onInit: function () {
            BaseController.prototype.onInit.apply(this);
            this.oRouter = this.getOwnerComponent().getRouter();
            // this.oRouter.attachRoutePatternMatched(this._onObjectMatched,this);
            this.oRouter.getRoute("subconASNcr").attachPatternMatched(this._onObjectMatched, this);
            this._localModel = this.getOwnerComponent().getModel("local");
            oControl = this;

            var oPack = this.getOwnerComponent().getModel("poservice");

            this.getView().byId("idMachdrp").setSelectedKey("");

            this.fetchPackageType();
            this.fetchMachineList();
            // Read data from the OData service
            // oPack.read("/YMM_SUPPLIER_PO_BAGSet", {
            //     success: function (oData) {
            //         debugger;
            //         sap.ui.core.BusyIndicator.hide();
            //         var oJsonModel = new sap.ui.model.json.JSONModel();
            //         oJsonModel.setData(oData.results);

            //         // Set the JSON model to the view for the dropdown
            //         oControl.getView().setModel(oJsonModel, "dropModel");
            //     },
            //     error: function (oErr) {
            //         sap.ui.core.BusyIndicator.hide();
            //         console.error(oErr);
            //         MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
            //     }
            // });

        },
        _onObjectMatched: function (oEvent) {
            // Perform the refresh logic here        
            this._refreshView();
        },
        onBeforeRendering: function () {
            if (this.oRouter) {
                // Detach PatternMatched before re-rendering
                this.oRouter.getRoute("subconASNcr").detachPatternMatched(this._onObjectMatched, this);
            }
        },

        onAfterRendering: function () {
            // Re-attach PatternMatched after rendering
            this.oRouter.getRoute("subconASNcr").attachPatternMatched(this._onObjectMatched, this);
        },
        onSelectChange: function (oEvent) {
            // Get the selected item
            var oSelect = oEvent.getSource();

            // Log the selected item and its key
            var oSelectedItem = oSelect.getSelectedItem();

            this.sSelectedKey = oSelectedItem.getKey();
        },
        onMachineSelect: function (oEvent) {
            // Get the selected item            
            var oSelect = oEvent.getSource();

            // Log the selected item and its key
            var oSelectedItem = oSelect.getSelectedItem();

            this.sSelectedMachine = oSelectedItem.getKey();
        },
        _refreshView: function () {

            // this.getView().byId("idWerk").setValue('');
            // this.getView().byId("idLifn").setValue('');
            // this.getView().byId("idInvNo").setValue('');
            // this.getView().byId("idInvItm").setValue('');
            this.getView().byId("idDcNo").setValue('');
            this.getView().byId("datePicker").setValue('');
            this.getView().byId("idInvQty").setValue('');
            this.getView().byId("idLrNo").setValue('');
            this.getView().byId("datePicker_lr").setValue('');
            this.getView().byId("idselpt").setValue('');
            this.getView().byId("idNoPckg").setValue('');
            this.getView().byId("idMatWgt").setValue('');
            this.getView().byId("idVhNo").setValue('');
            this.getView().byId("datePicker_ed").setValue('');
            this.getView().byId("idLifn2").setValue('');
            // this.getView().byId("invoiceFileName").setText('');
            // this.getView().byId("dhsFileName").setText('');


            var sModel = this.getOwnerComponent().getModel("selectedRecords");
            var oJsonModel = new sap.ui.model.json.JSONModel();
            oJsonModel.setData(sModel.oData);
            this.getView().setModel(oJsonModel, "regasnmodel");

        },
        onInvoiceQtyChange: function (oEvent) {
            // Get the entered invoice quantity from the input field
            var sInvQty = parseFloat(oEvent.getSource().getValue());

            if (!sInvQty || sInvQty === 0) {
                MessageBox.error("Invoice quantity must not be zero");
                // Optionally, you can clear the input field or set a default value
                oEvent.getSource().setValue(""); // Clear the input field
                return; // Stop further execution
            }

            // Get the reference to the table and its items (rows)
            var oTable = this.byId("idSelASN");
            var aItems = oTable.getItems();
            var totalBalQty = 0;

            // First, calculate the total balance quantity available in the table
            aItems.forEach(function (oItem) {
                var oCells = oItem.getCells();
                var balQty = parseFloat(oCells[8].getText()); // Get Balqty value from the 8th cell
                totalBalQty += balQty;
            });

            // Check if the invoice quantity exceeds the total balance quantity
            if (sInvQty > totalBalQty) {
                MessageBox.error("Invoice quantity is greater than the total balance quantity.");
                return;
            }

            // If valid, start splitting the invoice quantity into line items
            aItems.forEach(function (oItem) {
                var oCells = oItem.getCells();
                var balQty = parseFloat(oCells[8].getText()); // Get Balqty from the table

                if (sInvQty > 0) {
                    var allocatedQty = Math.min(balQty, sInvQty); // Allocate the minimum of balance and remaining invoice quantity
                    sInvQty -= allocatedQty; // Reduce the remaining invoice quantity

                    // Fill the allocated quantity into the Advqty input field (9th cell)
                    var oAdvQtyInput = oCells[9];
                    oAdvQtyInput.setValue(allocatedQty.toFixed(2)); // Set allocated quantity in the table row
                } else {
                    // If the invoice quantity has been fully distributed, set remaining Advqty to zero
                    var oAdvQtyInput = oCells[9];
                    oAdvQtyInput.setValue("0.00"); // Clear the rest of the rows
                }
            });
        },
        onSaveASN: async function (oEvent) {

            // Get references to all mandatory fields
            let sDcno = this.getView().byId("idDcNo").getValue();
            let sDcdate = this.getView().byId("datePicker").getValue();
            let sInvQty = this.getView().byId("idInvQty").getValue();
            let sLrNo = this.getView().byId("idLrNo").getValue();
            let sLrDate = this.getView().byId("datePicker_lr").getValue();
            let sSelPt = this.getView().byId("idselpt").getSelectedKey();
            let sNoPckg = this.getView().byId("idNoPckg").getValue();
            let sMatWgt = this.getView().byId("idMatWgt").getValue();
            let sVhNo = this.getView().byId("idVhNo").getValue();




            debugger;
            // Create an array of mandatory fields to validate
            let aMandatoryFields = [
                { field: sDcno, fieldId: "idDcNo", fieldName: "DC Number" },
                { field: sDcdate, fieldId: "datePicker", fieldName: "DC Date" },
                { field: sInvQty, fieldId: "idInvQty", fieldName: "Invoice Quantity" },
                { field: sLrNo, fieldId: "idLrNo", fieldName: "LR Number" },
                { field: sLrDate, fieldId: "datePicker_lr", fieldName: "LR Date" },
                { field: sSelPt, fieldId: "idselpt", fieldName: "Selection Point" },
                { field: sNoPckg, fieldId: "idNoPckg", fieldName: "Number of Packages" },
                { field: sMatWgt, fieldId: "idMatWgt", fieldName: "Material Weight" },
                { field: sVhNo, fieldId: "idVhNo", fieldName: "Vehicle Number" }
            ];

            // Loop through fields and check for empty values
            let bValidationError = false;
            aMandatoryFields.forEach(function (oField) {
                if (!oField.field) {
                    // Highlight the field and show error message
                    this.getView().byId(oField.fieldId).setValueState(sap.ui.core.ValueState.Error);
                    bValidationError = true;
                } else {
                    // Clear the error state if field is filled
                    this.getView().byId(oField.fieldId).setValueState(sap.ui.core.ValueState.None);
                }
            }.bind(this));

            // If validation fails, show an error message and stop execution
            if (bValidationError) {
                MessageBox.error("Please fill in all mandatory fields.");
                return;
            }

            this._userModel = this.getOwnerComponent().getModel("userModel");
            let sEmail = this._userModel.oData.email;

            let aFilters = [
                new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail),
                new sap.ui.model.Filter("Dcno", sap.ui.model.FilterOperator.EQ, sDcno),
                new sap.ui.model.Filter("Dcdate", sap.ui.model.FilterOperator.EQ, sDcdate)
            ];

            oModel = this.getOwnerComponent().getModel("asncrt");

            var oRadioButtonGroup = this.byId("idRadioGroup");
            var iSelectedIndex = oRadioButtonGroup.getSelectedIndex();

            oModel.read("/ZET_ASN_CRTSet", {
                filters: aFilters,
                success: function (oData, response) {
                    sap.ui.core.BusyIndicator.hide();
                    // Check if any records are returned from the OData service
                    if (oData.results && oData.results.length > 0) {
                        // If records exist, show a warning messages
                        MessageBox.warning("The DC number " + sDcno + " with date " + sDcdate + " already exists.");
                    } else {
                        // If no records are found, you can proceed with further logic here
                        // Example: Proceed with saving the new DC number
                        // this._createASNRecord();  
                        if (iSelectedIndex === 0) {
                            this._checkmaxquantity().then(() => {
                                debugger;
                                // If successful, proceed with saving the new DC number
                                this._createASNRecord();
                            }).catch((error) => {
                                debugger;
                                // console.error("Error in _checkmaxquantity:", error);
                                // MessageBox.error("Quantity exceeds maximum stock!");
                                MessageBox.error(error);
                                // MessageBox.error("Failed to validate max quantity. Please check your input.");
                            });
                        } else {
                            // If the selected index is not 0, directly proceed to create the ASN record
                            this._createASNRecord();
                        }
                    }
                }.bind(this),
                error: function (oErr) {
                    debugger;
                    console.log(oErr);
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
                }
            });
        },
        _checkmaxquantity: function () {
            return new Promise((resolve, reject) => {
                var oTable = this.byId("idSelASN");
                var aItems = oTable.getItems();
                var aData = [];

                let sEbeln = this.getView().byId("idInvNo").getValue();
                let sEbelp = this.getView().byId("idInvItm").getValue();
                let sWerks = this.getView().byId("idWerk").getValue();
                let sEmail = this._userModel.oData.email;

                debugger;
                // Collect all op_matnr values from the table rows
                aItems.forEach(function (oItem) {
                    var oContext = oItem.getBindingContext("regasnmodel");
                    if (oContext) {
                        var sPartNumber = oContext.getProperty("Op_matnr");
                        if (sPartNumber) {
                            aData.push(sPartNumber);
                        }
                    }
                });

                // Build a filter query for OData
                var aFilters = [];
                if (aData.length > 0) {
                    // Create an OR filter for all part numbers
                    var aMatnrFilters = aData.map(function (partNumber) {
                        return new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, partNumber);
                    });

                    // Combine all part number filters with OR logic
                    var oMatnrFilterGroup = new sap.ui.model.Filter({
                        filters: aMatnrFilters,
                        and: false // OR logic
                    });

                    // Add the part number filter group to the filters array
                    aFilters.push(oMatnrFilterGroup);
                }

                aFilters.push(new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail));
                aFilters.push(new sap.ui.model.Filter("Ebeln", sap.ui.model.FilterOperator.EQ, sEbeln));
                aFilters.push(new sap.ui.model.Filter("Ebelp", sap.ui.model.FilterOperator.EQ, sEbelp));
                aFilters.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sWerks));


                oModel = this.getOwnerComponent().getModel("asncrt");
                oModel.read("/ZET_MAX_QTYSet", {
                    filters: aFilters,
                    success: function (oData, response) {
                        sap.ui.core.BusyIndicator.hide();
                        debugger;
                        // Check if any records are returned from the OData service                    
                        var maxQty = parseFloat(oData.results[0].Maxv)
                        var maxInd = oData.results[0].Maxind;
                        let sInvQty = this.getView().byId("idInvQty").getValue();
                        var sInvQtyP = parseFloat(sInvQty) || 0;
                       
                        if (maxInd === 'X') {
                            maxInd = null;
                            if (sInvQtyP > maxQty) {
                                maxQty = 0;
                                sInvQty = null;
                                sInvQtyP = 0;
                                // MessageBox.error("Quantity exceeds maximum stock!");
                                reject("Quantity exceeds maximum stock!");
                                return;
                            }
                        } else if (maxInd === 'Y') {
                            reject("Maximum stock level not available for material!");   
                            return;                     
                        } 
                        resolve();
                    }.bind(this),
                    error: function (oErr) {
                        debugger;
                        console.log(oErr);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error(JSON.parse(oErr.responseText).error.innererror.errordetails[0].message);
                    }
                });
            });
        },
        _validateVehicleNumber: function (oModel, aFilters) {
            return new Promise(function (resolve) {
                oModel.read("/VehicleNumberSet", {
                    filters: aFilters,
                    success: function (oData) {
                        if (oData.results.length === 1) {
                            MessageBox.error(oData.results[0].Message);
                            resolve(false); // Validation failed
                        } else {
                            resolve(true); // Validation passed
                        }
                    },
                    error: function () {
                        resolve(false); // Error occurred, treat as invalid
                    }
                });
            });
        },

        _createASNRecord: async function () {
            let oModel = this.getOwnerComponent().getModel("asncrt");
            this.getView().setModel(oModel);
            var oPayload = this._localModel.getProperty("/asnData");

            var oDatePicker = this.getView().byId("datePicker");
            var oDatePicker_ed = this.getView().byId("datePicker_ed");
            var oDatePicker_lr = this.getView().byId("datePicker_lr");

            // Get the selected date value from the DatePicker
            var sDate = oDatePicker.getValue(); // The date in "yyyy-MM-dd" format
            var sDate_de = oDatePicker_ed.getValue(); // The date in "yyyy-MM-dd" format
            var sDate_lr = oDatePicker_lr.getValue();

            // Get the Base64 values from the model
            let oLocalModel = this.getView().getModel("local");

            oPayload.Dcdate = sDate;
            oPayload.exDelvDate = sDate_de;
            oPayload.Lrdate = sDate_lr;
            oPayload.Magrv = this.sSelectedKey;
            oPayload.Arbpl = this.sSelectedMachine;

            var oTable = this.byId("idSelASN");
            var aItems = oTable.getItems();
            var aData = [];
            // Loop through table items            
            aItems.forEach(function (oItem, index) {
                var oCells = oItem.getCells();
                // Get the Advqty from the 9th cell (index 8)
                // var sAdvqty = oCells[8].mProperties.text;
                var sAdvqty = oCells[9].getValue();
                if (sAdvqty) {
                    // index = index + 1
                    if (index === 0) {
                        oPayload.Exnum1 = oCells[0].mProperties.text, // Get value from first cell
                            oPayload.Menge1 = sAdvqty, // Get value from second cell
                            oPayload.Werks = oCells[2].mProperties.text,
                            oPayload.Lifnr = oCells[3].mProperties.text,
                            // oPayload.Op_matnr = oCells[4].mProperties.text,
                            oPayload.Ebeln = oCells[10].mProperties.text,
                            oPayload.Ebelp = oCells[11].mProperties.text,
                            oPayload.Matnr = oCells[4].mProperties.text,
                            oPayload.Exyear1 = oCells[12].mProperties.text


                    } else if (index === 1) {
                        oPayload.Exnum2 = oCells[0].mProperties.text, // Get value from first cell
                            oPayload.Exyear2 = oCells[12].mProperties.text
                        oPayload.Menge2 = sAdvqty // Get value from second cell
                    } else if (index === 2) {
                        oPayload.Exnum3 = oCells[0].mProperties.text, // Get value from first cell
                            oPayload.Exyear3 = oCells[12].mProperties.text
                        oPayload.Menge3 = sAdvqty // Get value from second cell                    
                    } else if (index === 3) {
                        oPayload.Exnum4 = oCells[0].mProperties.text, // Get value from first cell
                            oPayload.Exyear4 = oCells[12].mProperties.text
                        oPayload.Menge4 = sAdvqty // Get value from second cell
                    } else {

                    }
                }

            });

            var asnModel = this.getOwnerComponent().getModel("ASNMODEL");
            var oASNData = asnModel.getData();

            oPayload.Ebeln = oASNData.Ebeln; // Purchase Order Number
            oPayload.Ebelp = oASNData.Ebelp; // Purchase Order Item Number

            var oRadioButtonGroup = this.byId("idRadioGroup");
            var iSelectedIndex = oRadioButtonGroup.getSelectedIndex();
            if (iSelectedIndex === 0) {
                oPayload.Grstatus = "C";
            } else if (iSelectedIndex === 1) {
                oPayload.Grstatus = "N";
            }

            aData.push(oPayload);
            var sBatchGroupId = "CreateBatchGroup";

            // Set the group as deferred so that all operations are collected until submitChanges is called
            oModel.setDeferredGroups([sBatchGroupId]);
            //Testing added on 22.10.2024
            // const token = await this.getCsrfToken_asn("/nodeapp/custom/asncreate");
            let csrfToken = null;
            // First, fetch the CSRF token, then call createAsn function with payload
            // this.fetchCsrfToken().done(function () {
            this.createAsn(oPayload);
            // }.bind(this));
        },
        // fetchCsrfToken: function () {
        //     return $.ajax({
        //         type: "GET",
        //         url: "/nodeapp/custom/asncreate",
        //         headers: {
        //             "X-CSRF-Token": "fetch",
        //             "Content-Type": "application/json"                    
        //         },
        //         success: function (data, textStatus, request) {                    
        //             csrfToken = request.getResponseHeader("x-csrf-token");
        //             debugger;
        //             if (!csrfToken) {
        //                 MessageBox.error("CSRF token not received.");
        //               }
        //         },
        //         error: function (err) {
        //             MessageBox.error("Failed to fetch CSRF token: " + err.statusText);
        //         }
        //     });
        // },
        createAsn: async function (oPayload) {
            let lv_werks = this.getView().byId('idWerk').getValue();
            let lv_bukrs = '5010';
            // this.fetchMachineMandat(lv_werks, lv_bukrs);

            const isValidationPassed = await this.fetchMachineMandat(lv_werks, lv_bukrs);
            if (!isValidationPassed) {
                return; // Stop further processing if validation failed
            }
            debugger;
            // POST request to create ASN            
            $.ajax({
                url: "/nodeapp/custom/asnpost",
                type: "POST",
                contentType: "application/json; charset=UTF-8",
                data: JSON.stringify(oPayload),
                headers: {
                    // "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                },
                success: async function (oData) {
                    debugger;
                    const asnNumber = oData.d.Asnno;
                    try {
                        // Upload attachments and wait for completion
                        // await this.uploadAttachments(asnNumber);

                        MessageBox.success("ASN Number Created: " + oData.d.Asnno, {
                            onClose: async function () {
                                // await this.uploadAttachments(asnNumber);
                                var oLocalModel = this.getView().getModel("local");
                                oLocalModel.setData({
                                    asnData: {
                                        Dcno: "",
                                        Menge: "",
                                        Lrnumber: "",
                                        Zpack: "",
                                        Asnweight: "",
                                        Vechileno: "",
                                        exDelvDate: "",
                                        Lrdate: ""

                                    },
                                    // attachData: {
                                    //     mimetype: "",
                                    //     InvoiceFileName: "",
                                    //     InvoiceFileBase64: "",
                                    //     DhsFileName: "",
                                    //     DhsFileBase64: ""
                                    // }
                                });

                                // Clear the Machine dropdown selection
                                var oMachineSelect = this.getView().byId("idMachdrp");
                                oMachineSelect.setSelectedKey(null);
                                oLocalModel.updateBindings(true);
                                history.go(-1);
                            }.bind(this)
                        });

                    } catch (error) {
                        // Handle attachment upload failure
                        MessageBox.error(
                            "ASN created, but there was an error uploading attachments.\n" +
                            "Error Details: " + error.message
                        );
                    }
                }.bind(this),
                error: function (oErr) {
                    var statusCode = oErr.status;
                    var statusText = oErr.statusText;
                    var responseText = oErr.responseText;
                    MessageBox.error(
                        "Error occurred during ASN creation. " +
                        "Status: " + statusCode + " (" + statusText + ")\n" +
                        "Details: " + responseText
                    );
                }
            });
        },
        uploadAttachments: async function (asnNumber) {
            const oLocalModel = this.getView().getModel("local");
            const attachData = oLocalModel.getProperty("/attachData");
            debugger;
            // Configure ODataModel for the AttachmentSet
            const oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/YMM_SUPPLIER_PO_SRV/");
            // const concatenatedFileName = `${asnNumber}/${attachData.InvoiceFileName || attachData.DhsFileName}`;

            const uploadFile = (fileName, base64Data, mimeType, filePrefix) => {
                if (!fileName || !base64Data) {
                    return Promise.resolve(); // Skip if no file data
                }

                let concatenatedFileName = `${asnNumber}/`;

                // Concatenate the prefix ('INV' or 'DHS') to the filename
                concatenatedFileName += filePrefix + fileName;

                // Prepare payload
                const oFileData = {
                    AsnNumber: asnNumber, // Bind ASN Number
                    FileName: fileName,
                    MimeType: mimeType,
                    Base64Content: base64Data
                };

                // Set custom headers
                const mHeaders = {
                    "slug": concatenatedFileName  // Use filename as slug
                };

                // Return a promise for the upload request
                return new Promise((resolve, reject) => {
                    oDataModel.create("/AttachmentSet", oFileData, {
                        headers: mHeaders,
                        success: function () {
                            MessageToast.show(`File uploaded successfully: ${fileName}`);
                            resolve();
                        },
                        error: function (oError) {
                            MessageBox.error(`Error uploading file: ${fileName}`);
                            reject(oError);
                        }
                    });
                });
            };

            // // Check and upload Invoice Attachment
            // if (attachData.InvoiceFileName && attachData.InvoiceFileBase64) {
            //     await uploadFile(attachData.InvoiceFileName, attachData.InvoiceFileBase64, attachData.mimetype, 'INV');
            // }

            // // Check and upload DHS Attachment
            // if (attachData.DhsFileName && attachData.DhsFileBase64) {
            //     await uploadFile(attachData.DhsFileName, attachData.DhsFileBase64, attachData.mimetype, 'DHS');
            // }
        },
        getCsrfToken: function (url) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    type: "GET",
                    url: url,  // Same URL as the logoutEndpoint
                    headers: {
                        "X-CSRF-Token": "fetch",  // To fetch the token
                        "Content-Type": "application/json"
                    },
                    success: function (data, textStatus, request) {
                        const token = request.getResponseHeader("X-CSRF-Token");
                        debugger;
                        resolve(token);
                    },
                    error: function (xhr, status, error) {
                        console.error("Failed to fetch CSRF token:", error);
                        reject(error);
                    }
                });
            });
        },
        getCsrfToken_asn: function (url) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    type: "GET",
                    url: url,  // Same URL as the logoutEndpoint
                    headers: {
                        "X-CSRF-Token": "fetch",  // To fetch the token
                        "Content-Type": "application/json"
                    },
                    success: function (data, textStatus, request) {
                        const token = request.getResponseHeader("X-CSRF-Token");
                        debugger;
                        resolve(token);
                    },
                    error: function (xhr, status, error) {
                        console.error("Failed to fetch CSRF token:", error);
                        reject(error);
                    }
                });
            });
        },
        onChange: function (oEvent) {
            var bState = oEvent.getParameter("state");

            var oLab = this.byId("idSecVend");
            oLab.setVisible(bState);

            var oInput = this.byId("idLifn2");
            oInput.setVisible(bState);


        },
        onDateChange: function (oEvent) {
            var oDatePicker = oEvent.getSource();
            var sValue = oDatePicker.getValue(); // Get the selected date value in yyyy-MM-dd format

            if (sValue) {
                var oSelectedDate = new Date(sValue);
                var oToday = new Date();

                // Remove the time component from today's date
                // Normalize both selected date and today's date to midnight (removing time component)
                oSelectedDate.setHours(0, 0, 0, 0);
                oToday.setHours(0, 0, 0, 0);

                // Check if the selected date is greater than today's date
                if (oSelectedDate > oToday) {
                    // Set error state and message
                    oDatePicker.setValueState(sap.ui.core.ValueState.Error);
                    oDatePicker.setValueStateText("Future dates are not allowed.");
                    oDatePicker.setValue("");
                    return;
                } else {
                    // Clear error state
                    oDatePicker.setValueState(sap.ui.core.ValueState.None);

                }
            }
        },
        onExpDelivChange: function (oEvent) {
            var oDatePicker = oEvent.getSource();
            var sValue = oDatePicker.getValue(); // Get the selected date value in yyyy-MM-dd format

            if (sValue) {
                var oSelectedDate = new Date(sValue);
                var oToday = new Date();

                // Remove the time component from today's date
                // Normalize both selected date and today's date to midnight (removing time component)
                oSelectedDate.setHours(0, 0, 0, 0);
                oToday.setHours(0, 0, 0, 0);

                // Check if the selected date is greater than today's date
                if (oSelectedDate < oToday) {
                    // Set error state and message
                    oDatePicker.setValueState(sap.ui.core.ValueState.Error);
                    oDatePicker.setValueStateText("Past dates are not allowed.");
                    oDatePicker.setValue("");
                    return;
                } else {
                    // Clear error state
                    oDatePicker.setValueState(sap.ui.core.ValueState.None);
                }
            }
        },


        onAsnweight: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();

            // Regular expression to allow only numbers with optional decimal
            var regex = /^[0-9]*\.?[0-9]*$/;

            if (regex.test(sValue)) {
                // If value matches the regex, set valid state
                oInput.setValueState(sap.ui.core.ValueState.None);
            } else {
                // If value doesn't match, set invalid state and show error
                oInput.setValueState(sap.ui.core.ValueState.Error);
                oInput.setValueStateText("Please enter a valid number with or without decimals.");
            }
        },

        fetchPackageType: async function () {
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
                // Handle the DA list (e.g., bind to a model or display in a view)
                const oJsonModel = new sap.ui.model.json.JSONModel(PackType);
                that.getView().setModel(oJsonModel, "dropModel");

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching Package Type:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // Show error message
                // MessageBox.error(errorMessage);
            }
        },
        fetchMachineMandat: async function (v_werks, v_bukrs) {
            debugger;
            const that = this; // Preserve the reference to the controller            
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/mandtmachine",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json",
                    data: {
                        werks: v_werks,
                        bukrs: v_bukrs
                    }   // Send the email as a query parameter
                });
                console.log("response is ", response);
                // Success handling
                // sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                // Process the response to get the tokens and DA list    
                debugger;
                // Process the response to determine if the field should be mandatory
                const isMandatory = response[0].Machine;

                // Get a reference to the field and its label
                const oSelectField = this.getView().byId("idMachdrp");
                const selectedKey = oSelectField.getSelectedKey();
                const oLabel = this.getView().byId("idMachineLabel");  // Assume the label has this ID

                // Set the required property of the label based on the response
                if (isMandatory) {
                    oLabel.setRequired(true);
                } else {
                    oLabel.setRequired(false);
                }
                if (isMandatory && !selectedKey) {
                    MessageBox.error("Please fill in the Machine field, as it is mandatory.", {
                        onClose: () => {
                            oSelectField.focus();  // Set focus on the field to prompt user to fill it
                        }
                    });
                    return false;
                }
                return true;
                // Handle the DA list (e.g., bind to a model or display in a view)            
            } catch (oErr) {
                debugger;
                // sap.ui.core.BusyIndicator.hide();
                // console.error("Error fetching DA List:", oErr);
                // If the error response contains a message, display it in the MessageBox
                // const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // // Show error message
                // MessageBox.error(errorMessage);
            }
        },
        fetchMachineList: async function () {
            const that = this; // Preserve the reference to the controller

            sap.ui.core.BusyIndicator.show();
            try {
                // Make a request to your custom Node.js backend to get the CSRF token and DA list
                const response = await $.ajax({
                    url: "/nodeapp/machinelist",     // Your custom backend route
                    method: "GET",              // Use GET since you're retrieving data         
                    contentType: "application/json"// Send the email as a query parameter
                });
                // Success handling
                sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

                // Process the response to get the tokens and DA list                
                const MachineList = response;        // Extract DA list data                
                // Handle the DA list (e.g., bind to a model or display in a view)
                const oJsonModel = new sap.ui.model.json.JSONModel(MachineList);
                that.getView().setModel(oJsonModel, "MachListModel");

            } catch (oErr) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error fetching Package Type:", oErr);
                // If the error response contains a message, display it in the MessageBox
                const errorMessage = oErr.responseJSON?.error?.innererror?.errordetails?.[0]?.message || "Unknown error occurred";

                // Show error message
                MessageBox.error(errorMessage);
            }
        },
        onNumberValidation: function (oEvent) {
            // Get the entered value
            const sValue = oEvent.getParameter("value");
            const oInput = oEvent.getSource();

            // Regular expression to allow only numbers
            const regex = /^[0-9]*$/;

            // Validate the input
            if (!regex.test(sValue)) {
                // Set the error state and display error message
                oInput.setValueState("Error");
                oInput.setValueStateText("Please Enter Numbers only");
            } else {
                // Clear the error state if input is valid
                oInput.setValueState("None");
            }
        },
        // onVehicleValidation: function (oEvent) {
        //  liveChange=".onVehicleValidation" to be set in screen
        //     // Get the entered value
        //     var sVhNo = oEvent.getParameter("value");

        //     // Define the regex pattern for validation
        //     var oRegex = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;

        //     // Get the input control for displaying error state
        //     var oInput = oEvent.getSource();

        //     if (oRegex.test(sVhNo)) {
        //         // If valid, remove error state
        //         oInput.setValueState("None");
        //     } else {
        //         // If invalid, set error state and message
        //         oInput.setValueState("Error");
        //         oInput.setValueStateText("Invalid Vehicle Number format");
        //     }
        // },
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
                // oInput.setValue("");
            } else {
                // Reset the value state if the length is valid
                oInput.setValueState("None");
            }
        },
        // onAttachFilePress: function (oEvent) {
        //     const input = document.createElement("input");
        //     input.type = "file";
        //     input.accept = "*/*"; // Allow all file types

        //     input.onchange = (e) => {
        //         const file = e.target.files[0];
        //         if (file) {
        //             const fileName = file.name; // Ensure fileName is captured here
        //             const fileType = file.type;
        //             const reader = new FileReader();

        //             reader.onload = (event) => {
        //                 const base64String = event.target.result.split(',')[1]; // Extract Base64 data

        //                 // Update the model with Base64 and file name
        //                 const buttonId = oEvent.getSource().getId();
        //                 if (buttonId.includes("invoiceAttachment")) {
        //                     this.getView().getModel("local").setProperty("/attachData/InvoiceFileName", fileName);
        //                     this.getView().getModel("local").setProperty("/attachData/InvoiceFileBase64", base64String);
        //                     this.getView().getModel("local").setProperty("/attachData/mimetype", fileType);
        //                 } else if (buttonId.includes("dhsAttachment")) {
        //                     this.getView().getModel("local").setProperty("/attachData/DhsFileName", fileName);
        //                     this.getView().getModel("local").setProperty("/attachData/DhsFileBase64", base64String);
        //                     this.getView().getModel("local").setProperty("/attachData/mimetype", fileType);
        //                 }
        //             };

        //             // Read the file as a Base64 string
        //             reader.readAsDataURL(file);
        //         }
        //     };

        //     input.click(); // Open the file dialog
        // },

    });
});