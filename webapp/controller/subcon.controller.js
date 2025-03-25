sap.ui.define([
  'zmmsubcontract/controller/BaseController',
  "sap/ui/core/Popup",
  "sap/m/Popover",
  "sap/m/VBox",
  "sap/m/Label",
  "sap/m/Button",
  "sap/m/GenericTile",
  'sap/m/MessageBox',
  "sap/ui/core/Fragment",
  "jquery.sap.global"
], function (BaseController, Popup, Popover, VBox, Label, Button, GenericTile, MessageBox, Fragment, jQuery) {
  'use strict';
  return BaseController.extend("zmmsubcontract.controller.subcon", {

    onInit: function () {
      debugger;
      this.startSessionTimeout();
      this._userModel = this.getOwnerComponent().getModel("userModel");
      let me = this;
      fetch("/getUserInformation")
        .then(res => res.json())
        .then(data => {
          me._userModel.setProperty("/",
            {
              email: data.email,
              user: data.user, // Store user information
              scopes: data.scopes // Store user scopes
            });
          // Save data to localStorage
          localStorage.setItem("userInfo", JSON.stringify(data));
          console.log(me._userModel.getProperty("/"));
        })
        .catch(err => console.log(err));

      //******carasoul auto************ */
      var oCarousel = this.byId("idCars2");
      setInterval(function () {
        var aPages = oCarousel.getPages();
        var sActivePageId = oCarousel.getActivePage();
        var iCurrentPageIndex = -1;
        aPages.forEach(function (oPage, index) {
          if (oPage.getId() === sActivePageId) {
            iCurrentPageIndex = index;
          }
        });
        // Calculate the next page index
        var iNextPageIndex = (iCurrentPageIndex + 1) % aPages.length;

        // Navigate to the next page                  
        oCarousel.setActivePage(aPages[iNextPageIndex].getId());
      }, 4000); //

      //**************************************************** */

      BaseController.prototype.onInit.apply(this);
      this.oRouter = this.getOwnerComponent().getRouter();
      this.oRouter.getRoute("RouteView1").attachPatternMatched(this._onObjectMatched, this);

      var oPopover = this.getView().byId("popover");
      this._bInsidePopover = true;
      this._localModel = this.getOwnerComponent().getModel("local");
      this._homeModel = this.getOwnerComponent().getModel("home");
      this._SupSerModel = this.getOwnerComponent().getModel("SupSer");
      this._SubSerModel = this.getOwnerComponent().getModel("SubSer");
      this._VenOnbModel = this.getOwnerComponent().getModel("VenOnb");

      this._qisModel = this.getOwnerComponent().getModel("qis");
      this._TrnVenModel = this.getOwnerComponent().getModel("TrnVen");
      this._CrDrModel = this.getOwnerComponent().getModel("CrDr");
      this._ncrModel = this.getOwnerComponent().getModel("ncr");
      this._SupRatModel = this.getOwnerComponent().getModel("SupRat");
      this._circModel = this.getOwnerComponent().getModel("circ");
      this._dashModel = this.getOwnerComponent().getModel("dash");


      var oIconTabBar = this.getView().byId("idIconTabBar");
      var that = this;
      oIconTabBar.getItems().forEach(function (oItem) {
        oItem.addEventDelegate({
          onmouseover: function (oEvent) {
            that.onIconTabFilterHover(oEvent, oItem);
          },
          onmouseout: function (oEvent) {
            that.onIconTabFilterOut(oEvent, oItem);
          }
        });
      });

      oPopover.attachAfterOpen(function () {
        var oPopoverDomRef = oPopover.getDomRef();
        if (oPopoverDomRef) {
          oPopoverDomRef.addEventListener('mouseover', this.onPopoverMouseOver.bind(this));
          oPopoverDomRef.addEventListener('mouseout', this.onPopoverMouseOut.bind(this));
        }
      }.bind(this));


      //for email link hovering 
      var oLink = this.byId("idLEmail");
      // Add event delegate for mouse hover events
      oLink.addEventDelegate({
        onmouseover: this.onEmailHover.bind(this), // Call hover function
        onmouseout: this.onEmailMouseOut.bind(this) // Handle mouse out
      });
    },
    _onObjectMatched: function () {
      // Detach the event handler to prevent further calls
      this.oRouter.getRoute("RouteView1").detachPatternMatched(this._onObjectMatched, this);
    },
    onTabClick: function (oEvent, oItem) {
      if (sap.ui.Device.system.phone || sap.ui.Device.system.tablet) {
        debugger;
        var oIconTabBar = this.getView().byId("idIconTabBar");


        var oModel = this._localModel;
        var oHomeModel = this._homeModel;
        var oSubSerModel = this._SubSerModel;
        var oSupSerModel = this._SupSerModel;
        var oVenOnbModel = this._VenOnbModel;

        var oqisModel = this._qisModel;
        var oTrnVenModel = this._TrnVenModel;
        var oCrDrModel = this._CrDrModel;
        var oncrModel = this._ncrModel;
        var oSupRatModel = this._SupRatModel;
        var ocircModel = this._circModel;
        var odashModel = this._dashModel;

        var oPopover = this.getView().byId("popover");
        var that = this;
        switch (oIconTabBar.mProperties.selectedKey) {
          case "id_Home":
            that.getView().byId("idList").setModel(oHomeModel, "localData");
            // var oPopover = this.getView().byId("popover");                  
            break;
          case "id_SupSer":
            that.getView().byId("idList").setModel(oSupSerModel, "localData");
            break;
          case "id_SubSer":
            that.getView().byId("idList").setModel(oSubSerModel, "localData");
            break;
          case "id_VenOnb":
            that.getView().byId("idList").setModel(oVenOnbModel, "localData");
            break;
          case "id_Qis":
            that.getView().byId("idList").setModel(oqisModel, "localData");
            break;
          case "id_trVen":
            that.getView().byId("idList").setModel(oTrnVenModel, "localData");
            break;
          case "id_CrDbNt":
            that.getView().byId("idList").setModel(oCrDrModel, "localData");
            break;
          case "id_Ncr":
            that.getView().byId("idList").setModel(oncrModel, "localData");
            break;
          case "id_SupRt":
            that.getView().byId("idList").setModel(oSupRatModel, "localData");
            break;
          case "id_Cir":
            that.getView().byId("idList").setModel(ocircModel, "localData");
            break;
          case "id_Dash":
            that.getView().byId("idList").setModel(odashModel, "localData");
            break;
          default:
            oList.setModel(null);
        }

        var aVisibleItems = [];
        oIconTabBar.getItems().forEach(function (oItem) {

          var $itemDomRef = oItem.getDomRef();

          // Check if the tab has a DOM reference, meaning it's visible on the screen
          if ($itemDomRef && $itemDomRef.offsetParent !== null) {
            aVisibleItems.push(oItem);
          }
        });

        var selectedtab = oIconTabBar.mProperties.selectedKey;

        var oSelectedItem = aVisibleItems.find(function (oItem) {
          return oItem.getKey() === selectedtab;
        });

        if (oSelectedItem) {
          oIconTabBar.setSelectedKey(selectedtab);
          this._bInsidePopover = true;
          oPopover.openBy(oSelectedItem);
        }
      }
    },
    onIconTabFilterHover: function (oEvent, oItem) {
      var oIconTabBar = this.getView().byId("idIconTabBar");


      var oModel = this._localModel;
      var oHomeModel = this._homeModel;
      var oSubSerModel = this._SubSerModel;
      var oSupSerModel = this._SupSerModel;
      var oVenOnbModel = this._VenOnbModel;

      var oqisModel = this._qisModel;
      var oTrnVenModel = this._TrnVenModel;
      var oCrDrModel = this._CrDrModel;
      var oncrModel = this._ncrModel;
      var oSupRatModel = this._SupRatModel;
      var ocircModel = this._circModel;
      var odashModel = this._dashModel;

      var oPopover = this.getView().byId("popover");
      var that = this;
      switch (oItem.mProperties.key) {
        case "id_Home":
          that.getView().byId("idList").setModel(oHomeModel, "localData");
          // var oPopover = this.getView().byId("popover");                  
          break;
        case "id_SupSer":
          that.getView().byId("idList").setModel(oSupSerModel, "localData");
          break;
        case "id_SubSer":
          that.getView().byId("idList").setModel(oSubSerModel, "localData");
          break;
        case "id_VenOnb":
          that.getView().byId("idList").setModel(oVenOnbModel, "localData");
          break;
        case "id_Qis":
          that.getView().byId("idList").setModel(oqisModel, "localData");
          break;
        case "id_trVen":
          that.getView().byId("idList").setModel(oTrnVenModel, "localData");
          break;
        case "id_CrDbNt":
          that.getView().byId("idList").setModel(oCrDrModel, "localData");
          break;
        case "id_Ncr":
          that.getView().byId("idList").setModel(oncrModel, "localData");
          break;
        case "id_SupRt":
          that.getView().byId("idList").setModel(oSupRatModel, "localData");
          break;
        case "id_Cir":
          that.getView().byId("idList").setModel(ocircModel, "localData");
          break;
        case "id_Dash":
          that.getView().byId("idList").setModel(odashModel, "localData");
          break;
        default:
          oList.setModel(null);
      }

      var aVisibleItems = [];
      oIconTabBar.getItems().forEach(function (oItem) {

        var $itemDomRef = oItem.getDomRef();

        // Check if the tab has a DOM reference, meaning it's visible on the screen
        if ($itemDomRef && $itemDomRef.offsetParent !== null) {
          aVisibleItems.push(oItem);
        }
      });

      var selectedtab = oItem.mProperties.key;
      var oSelectedItem = aVisibleItems.find(function (oItem) {
        return oItem.getKey() === selectedtab;
      });

      if (oSelectedItem) {
        oIconTabBar.setSelectedKey(oItem.getKey());
        this._bInsidePopover = true;
        oPopover.openBy(oSelectedItem);
      }
    },

    onIconTabFilterOut: function (oEvent, oItem) {
      var oPopover = this.getView().byId("popover");
      this._bInsidePopover = false;
      setTimeout(function () {
        if (!this._bInsidePopover) {
          oPopover.close();
        }
      }.bind(this), 1000);
    },

    onTabSelect: function (oEvent) {
      // Handle tab select event if needed
    },
    onPopoverMouseOver: function (oEvent) {
      this._bInsidePopover = true;
    },
    onPopoverMouseOut: function () {
      var oPopover = this.getView().byId("popover");
      this._bInsidePopover = false;
      // Close the popover after a slight delay to allow for the mouse to move back into the tile
      setTimeout(function () {
        if (!this._bInsidePopover) {
          oPopover.close();
        }
      }.bind(this), 100);
    },
    onSubconDA: function () {
      debugger;
      if (!data.scopes || !data.scopes.includes("getuserinfo!t10709.read")) {
        // If the user doesn't have the required scope, navigate to the unauthorized page
        this.oRouter.navTo("unAuth");
      } else {
        this.oRouter.navTo("subconDA");
      }
    },
    OnCreateASN: function () {
      this.oRouter.navTo("subconASNcr");
    },
    onPress: function (oEvent) {
      var selectedRecord = oEvent.oSource.mProperties.title
      const userData = this._userModel.getProperty("/"); // Access the user data
      if (selectedRecord === 'DA schedule') {
        this.oRouter.navTo("subconDA");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        // this.oRouter.navTo("subconDA");
        // }                
      } else if (selectedRecord === 'ASN Create') {
        this.oRouter.navTo("RegASN");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("RegASN");
        // }                 
      }
      else if (selectedRecord === 'ASSEMBLY ASN') {
        this.oRouter.navTo("AsseASN")
      }
      else if (selectedRecord === 'ASN Report') {
        this.oRouter.navTo("asnrep");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("asnrep");
        // }                 
      }
      else if (selectedRecord === 'ASN Status') {
        this.oRouter.navTo("asnstat");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("asnstat");
        // }                   
      }
      else if (selectedRecord === 'ASN Delete') {
        this.oRouter.navTo("asndel");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("asndel");
        // }                                   
      }
      else if (selectedRecord === 'ASN Print') {
        this.oRouter.navTo("asnprint");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("asnprint");
        // }                  
      }
      else if (selectedRecord === 'PO Schedules') {
        this.oRouter.navTo("PoSchedule");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("PoSchedule");
        // }                 
      }
      else if (selectedRecord === 'Create ASN') {
        this.oRouter.navTo("SupAsnCrt");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("SupAsnCrt");
        // }                   
      }
      else if (selectedRecord === 'Supplier ASN Report') {
        this.oRouter.navTo("SupASNRep");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("SupASNRep");
        // }                  
      }
      else if (selectedRecord === 'Delete ASN') {
        this.oRouter.navTo("SupASNDel");
        // if (!userData.scopes || !userData.scopes.includes("getuserinfo!t10709.read")) {
        //   // If the user doesn't have the required scope, navigate to the unauthorized page
        //   this.oRouter.navTo("unAuth");
        // }else {
        //   this.oRouter.navTo("SupASNDel");
        // }                    
      }
      else {

      }
    },
    onAboutUsPress: function () {
      window.open("https://sundram.com/about-us.php", '_blank');

    },
    onContactsPress: function () {
      window.open("https://sundram.com/contact-us.php", '_blank');
    },

    onEmailHover: function (oEvent) {
      debugger;
      var oView = this.getView();
      // var oLink = oEvent.getSource();
      var oLink = oEvent.srcControl; // Get the link control

      if (!this._vendordetails) {
        Fragment.load({
          id: oView.getId(),
          name: "zmmsubcontract.fragments.vendordetails", // Path to the fragment
          controller: this
        }).then(function (oPopover) {
          oView.addDependent(oPopover);
          this._vendordetails = oPopover;
          this._loadVendorDetails(oLink);
          this._vendordetails.openBy(oLink);  // Open the popover next to the link
        }.bind(this));
      } else {
        this._loadVendorDetails(oLink);
        this._vendordetails.openBy(oLink);  // If already loaded, just open it
      }

    },
    // Function to load vendor details based on the email
    _loadVendorDetails: function (oLink) {
      this._userModel = this.getOwnerComponent().getModel("userModel");

      // Define a filter for the OData request
      var sEmail = this._userModel.getProperty("/email");
      // Store the email in local storage
      //   localStorage.setItem("userEmail", sEmail);
      // debugger;
      // let aFilters = [
      //   new sap.ui.model.Filter("Email", sap.ui.model.FilterOperator.EQ, sEmail)
      // ];

      // this._emailModel = this.getOwnerComponent().getModel("email");

      this.fetchVendor(sEmail);

      // this._emailModel.read("/ZET_VENDORSSet", {
      //   filters: aFilters,
      //   success: function (oData, response) {
      //     debugger;
      //     sap.ui.core.BusyIndicator.hide();
      //     var oJsonModel = new sap.ui.model.json.JSONModel();
      //     oJsonModel.setData(oData.results[0]);
      //     this._vendordetails.setModel(oJsonModel, "vendorModel");
      //   }.bind(this),
      //   error: function (oErr) {
      //     debugger;
      //     console.log(oErr);
      //     sap.ui.core.BusyIndicator.hide();
      //     // MessageBox.error("Failed to fetch vendor details.");
      //   }
      // });

    },
    fetchVendor: async function (email) {
      debugger;
      const that = this; // Preserve the reference to the controller

      sap.ui.core.BusyIndicator.show();
      try {
        // Make a request to your custom Node.js backend to get the CSRF token and DA list
        const response = await $.ajax({
          url: "/nodeapp/vendor",     // Your custom backend route
          method: "GET",              // Use GET since you're retrieving data         
          contentType: "application/json",
          data: { email: email }   // Send the email as a query parameter
        });
        // Success handling
        sap.ui.core.BusyIndicator.hide();  // Hide the busy indicator on success

        // Process the response to get the tokens and DA list                
        const vendorDetail = response;        // Extract DA list data
        debugger;

        var oJsonModel = new sap.ui.model.json.JSONModel(vendorDetail);
        //  oJsonModel.setData(oData.results[0]);
        oJsonModel.setData(vendorDetail[0]);
        that._vendordetails.setModel(oJsonModel, "vendorModel");

      } catch (oErr) {
        sap.ui.core.BusyIndicator.hide();
      }
    },
    // Function to close the popup when mouse leaves
    onEmailMouseOut: function () {
      if (this._vendordetails) {
        this._vendordetails.close();
      }
    },
    onLogOut: async function () {
      debugger;
      const token = await this.getCsrfToken("/nodeapp/custom/logout");
      // Make the POST request to perform the logout
      $.ajax({
        type: "POST",
        url: "/nodeapp/custom/logout",  // Ensure this matches your logoutEndpoint
        headers: {
          "X-CSRF-Token": token,
          "Content-Type": "application/json"
        },
        success: function (data) {
          window.location.href = data; // Or any page you prefer
        },
        error: function (xhr, status, error) {
          console.error("Logout failed:", error);
          console.log("Response status:", xhr.status); // Log status for further debug
          console.log("Response text:", xhr.responseText); // Log response text
        }
      });
    },
    // Helper function to fetch the CSRF token
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
    startSessionTimeout: function () {
      // Define your session timeout period in milliseconds (e.g., 15 minutes = 900000 ms)
      const sessionTimeout = 18000000; // 5 hours;
      let timeoutId;

      // Function to reset the session timeout
      const resetTimeout = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          this.onSessionTimeout(); // Call logout function when timeout occurs
        }, sessionTimeout);
      };

      // Add event listeners for user activity
      document.addEventListener("mousemove", resetTimeout);
      document.addEventListener("keydown", resetTimeout);

      // Start the session timeout initially
      resetTimeout();
    },

    onSessionTimeout: function () {
      // Show a message or directly log the user out
      sap.m.MessageToast.show("Session has expired due to inactivity.");

      // Call the function to refresh the session
      // this.refreshSession();

      // Call your logout function
      this.onLogOut();
    },
    // refreshSession: async function () {
    //   var that = this;
    //   var csrfToken = this.getCsrfToken("/nodeapp/refreshSession");
    //   debugger;
    //   try {
    //     $.ajax({
    //       type: "POST",
    //       url: "/nodeapp/refreshSession", // Ensure this endpoisnt handles session refresh
    //       headers: {
    //         "X-CSRF-Token": csrfToken,
    //         "Content-Type": "application/json"
    //       }
    //     });
    //     // Optionally, you can show a success message
    //     sap.m.MessageToast.show("Session refreshed successfully.");
    //   }
    //   catch {
    //     console.log("Session refresh failed.");
    //   }

    // },
    // getCsrfSessionToken: function () {
    //   var token;
    //   $.ajax({
    //     url: "/nodeapp/refreshSession",
    //     method: "HEAD", // Get CSRF token from the header
    //     async: false,
    //     success: function (res, status, xhr) {
    //       token = xhr.getResponseHeader("X-CSRF-Token");
    //       debugger;
    //     }
    //   });
    //   return token;
    // },

    // Method to update JWT token in local storage (if needed)
    // updateJwtToken: function (token) {
    //   // Store the new token (localStorage or sessionStorage can be used)
    //   localStorage.setItem("jwtToken", token);
    // }
    // onNewsPress : async function()  {
    //   debugger;
    //   try {
    //     // Make a request to your custom Node.js backend to get the CSRF token and DA list
    //     const response = await $.ajax({
    //       url: "/nodeapp/dalist",     // Your custom backend route
    //       method: "GET"              // Use GET since you're retrieving data         
    //     });
    //     debugger;
    //     // Process the response to get the tokens and DA list
    //     const csrfToken = response.csrfToken;  // Extract CSRF token        
    //     const daList = response.daList;        // Extract DA list data

    //     // Handle the DA list (e.g., bind to a model or display in a view)
    //     const oModel = new sap.ui.model.json.JSONModel(daList);
    //     this.getView().setModel(oModel, "DAListModel");

    //     // Now you have the CSRF token and DA list in your app, do what you need with it
    //     console.log("CSRF Token:", csrfToken);
    //     console.log("DA List:", daList);
    //   } catch (error) {
    //     console.error("Error fetching CSRF token or DA list:", error);
    //   }
    // }

  })

});