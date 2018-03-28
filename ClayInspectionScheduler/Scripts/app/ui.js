/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
var InspSched;
(function (InspSched) {
    var UI;
    (function (UI) {
        UI.CurrentPermits = new Array();
        UI.CurrentInspections = [];
        UI.PermitsWithOutInsp = [];
        UI.CurrentDetailsOpen = "";
        function Search(key) {
            clearElement(document.getElementById('SearchFailed'));
            Hide('PermitSelectContainer');
            Hide('CurrentPermitData');
            Hide('CurrentPermit');
            Hide('InspectionTable');
            Hide('SearchFailed');
            Hide('SuspendedContractor');
            Hide('NotScheduled');
            Show('Searching');
            var k = key.trim().toUpperCase();
            document.getElementById('PermitSearch').setAttribute("value", k);
            if (k.length == 8 && !isNaN(Number(k))) {
                return k;
            }
            else {
                Hide('Searching');
                UpdateSearchFailed(key);
                return null;
            }
        }
        UI.Search = Search;
        function ProcessResults(permits, key) {
            if (permits.length == 0) {
                UpdateSearchFailed(key);
            }
            else {
                AddPermit(permits, key);
                UpdatePermitData(key, permits);
                Hide('Searching');
                document.getElementById('CurrentPermitData').style.display = "flex";
                ShowTable(key, permits);
            }
        }
        UI.ProcessResults = ProcessResults;
        /**********************************
          
          Build Option List
        
        **********************************/
        function GetPermitList(key, permit) {
            InspSched.transport.GetPermit(key).then(function (permits) {
                UI.CurrentPermits = permits;
                InspSched.CurrentPermits = permits;
                ProcessResults(permits, key);
                return true;
            }, function () {
                console.log('error in GetPermits');
                // do something with the error here
                // need to figure out how to detect if something wasn't found
                // versus an error.
                Hide('Searching');
                return false;
            });
        }
        function AddPermit(permits, key) {
            var container = document.getElementById('PermitSelect');
            clearElement(container);
            var current = buildPermitSelectOptGroup("Search Results", "current");
            var related = buildPermitSelectOptGroup("Related Permits", "related");
            container.appendChild(current);
            if (permits.length > 1) {
                container.appendChild(related);
            }
            for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
                var permit = permits_1[_i];
                if (permit.PermitNo == key) {
                    current.appendChild(buildPermitSelectOption(permit, key));
                    GetInspList(key, permit);
                }
                else {
                    if (permits.length > 1)
                        related.appendChild(buildPermitSelectOption(permit, key));
                }
            }
        }
        function UpdatePermitData(key, permits) {
            var street = document.getElementById('ProjAddrCombined');
            var city = document.getElementById('ProjCity');
            clearElement(street);
            clearElement(city);
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === key; })[0];
            street.appendChild(document.createTextNode(permit.ProjAddrCombined.trim()));
            city.appendChild(document.createTextNode(permit.ProjCity.trim()));
            Show('PermitSelectContainer');
        }
        UI.UpdatePermitData = UpdatePermitData;
        function buildPermitSelectOptGroup(lbl, val) {
            //let og = document.createElement( "optgroup" );
            var og = document.createElement("optgroup");
            og.label = lbl;
            og.value = val;
            return og;
        }
        function createOptGroupElement(value, className) {
            var og = document.createElement("optgroup");
            if (className !== undefined) {
                og.className = className;
            }
            og.label = value;
            og.appendChild(document.createTextNode(value));
            return og;
        }
        function buildPermitSelectOption(permit, key) {
            var label = getInspTypeString(permit.PermitNo[0]);
            var option = document.createElement("option");
            option.setAttribute("value", permit.PermitNo.trim());
            option.setAttribute("label", permit.PermitNo + "  (" + label + ")");
            option.setAttribute("title", permit.PermitNo.trim());
            option.appendChild(document.createTextNode(permit.PermitNo + "  (" + label + ")"));
            option.id = "select_" + permit.PermitNo;
            if (permit.PermitNo == key) {
                option.value = permit.PermitNo.trim();
                option.selected = true;
            }
            else {
                option.value = permit.PermitNo.trim();
            }
            return option;
        }
        /**********************************
      
        Initial build:
          list is filled during search
          ProcessResults() calls GetInspList()
      
        Updating the Inspection List:
          select element: 'PermitSelect' will \
          trigger onchange event calling
          UpdateInspList()
        
        ***********************************/
        function GetInspList(key, permit) {
            document.getElementById('InspectionScheduler').removeAttribute("value");
            var saveButton = document.getElementById('SaveSchedule');
            if (saveButton != undefined) {
                saveButton.setAttribute("disabled", "disabled");
                saveButton.removeAttribute("value");
            }
            var completed = 0;
            var canSchedule = true;
            Hide('InspSched');
            Hide('InspListHeader');
            Hide('InspListData');
            Hide('SuspendedContractor');
            clearElement(document.getElementById('InspListData'));
            InspSched.transport.GetInspections(key).then(function (inspections) {
                if (inspections.length > 0) {
                    InspSched.CurrentInspections = inspections;
                    BuildInspectionList(InspSched.CurrentInspections, permit);
                }
                else {
                    // TODO: add 'NO INSPECTIONS ERROR'
                    document.getElementById('NoInspections').style.display = "flex";
                    document.getElementById("InspSched").style.display = "flex";
                    document.getElementById('InspectionTable').style.display = "flex";
                }
                BuildScheduler(InspSched.CurrentInspections, key);
                // This is how we auto select an inspection when one is passed from the inspection view.
                if (InspSched.CurrentPermits[0].access !== InspSched.access_type.public_access) {
                    var hash = new InspSched.LocationHash(location.hash.substring(1));
                    if (hash.InspectionId > 0) {
                        InspSched.UI.ToggleInspDetails(hash.InspectionId.toString());
                    }
                }
                return true;
            }, function () {
                console.log('error getting inspections');
                return false;
            });
        }
        UI.GetInspList = GetInspList;
        function BuildInspectionList(inspections, permit) {
            //For testing ONLY
            // Initialize element variable for list container 'InspListData'
            var InspList = document.getElementById('InspListData');
            var empty = document.createElement("tr");
            // TODO: add Try/Catch
            // create (call BuildInspectioN()) and add inspection row to container InspList
            console.log('inspections', inspections);
            for (var _i = 0, inspections_1 = inspections; _i < inspections_1.length; _i++) {
                var inspection = inspections_1[_i];
                if (permit) {
                    if (permit.access === InspSched.access_type.public_access) {
                        inspection.Comment = "";
                    }
                }
                InspList.appendChild(BuildInspectionRow(inspection));
            }
            InspList.style.removeProperty("display");
            document.getElementById("InspSched").style.removeProperty("display");
            document.getElementById('InspectionTable').style.display = "flex";
        }
        UI.BuildInspectionList = BuildInspectionList;
        // update BuildInspectionRow
        function BuildInspectionRow(inspection) {
            var BrowserName = CheckBrowser();
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === inspection.PermitNo; })[0];
            //permit.access = access_type.inspector_access;
            //let today = new Date().setHours(0, 0, 0, 0);
            //let SchedDate = Date.parse(inspection.DisplaySchedDateTime);
            var inspdetail = inspection.InspReqID.toString() + "_comments";
            var inspRow = document.createElement("div");
            //inspRow.setAttribute("elementName", "inspRow");
            // Set Inspection Row element classes 
            if (inspection.ResultADC.length == 0)
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
            else if (inspection.ResultADC == 'A' || inspection.ResultADC == 'P')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle PassRow";
            else if (inspection.ResultADC == 'C')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle CancelRow";
            else if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle FailRow";
            // #region DataRow
            //*******************************************************************************************
            var DataRow = document.createElement("div");
            DataRow.className = "large-12 medium-12 small-12 row flex-container align-middle";
            //DataRow.setAttribute("elementName", "dataColumn");
            var inspectionData = document.createElement("div");
            //inspectionData.setAttribute("elementName", "inspectionData");
            inspectionData.className = "large-10 medium-8 small-12";
            var permitNumber = document.createElement('div');
            permitNumber.className = "large-2 medium-6 small-6 column InspPermit ";
            //permitNumber.setAttribute("elementName", "permitNumber");
            var inspDesc = document.createElement("div");
            inspDesc.className = "large-5 medium-6 small-6 InspType column";
            //inspDesc.setAttribute("elementName", "inspDesc");
            inspDesc.appendChild(document.createTextNode(inspection.InsDesc.trim()));
            var inspDateTime = document.createElement("div");
            inspDateTime.id = inspection.InspReqID.toString() + "_inspection-date-time";
            inspDateTime.className = "large-2 medium-6 small-6 column InspDate";
            //inspDateTime.setAttribute("elementName", "inspDateTime");
            var inspector = document.createElement("div");
            inspector.className = "large-3 medium-6 small-12 InspResult column end";
            //inspector.setAttribute("elementName", "inspector");
            inspector.appendChild(document.createTextNode(inspection.InspectorName.trim()));
            //********************************************
            var InspButtonContainer = document.createElement("div");
            //InspButtonDiv.setAttribute("elementName", "InspButtonDiv");
            InspButtonContainer.className = "ButtonContainer column large-2 medium-4 small-12 flex-container align-center";
            // #endregion
            // #region Completed Remarks Row
            //*******************************************************************************************
            var DetailsContainer = document.createElement("div");
            DetailsContainer.className = "large-12 medium-12 small-12 row flex-container align-middle details-container";
            //DetailsContainer.setAttribute("elementName", "DetailsSection");
            //*********************************************
            var CompletedRemarks = document.createElement("div");
            //CompletedRemarks.setAttribute("elementName", "CompletedRemarks");
            CompletedRemarks.className = "large-12 medium-12 small-12 row";
            CompletedRemarks.id = inspection.InspReqID.toString() + "_completed_remark";
            CompletedRemarks.style.display = "flex";
            var Remark = document.createElement("div");
            Remark.className = "column large-9 medium-6 small-6 inspRemarks";
            //Remark.setAttribute("elementName", "Remark");
            Remark.id = inspection.InspReqID.toString() + "_completed_remark_text";
            Remark.appendChild(document.createTextNode((inspection.Remarks !== null && inspection.Remarks !== "" ? inspection.Remarks.trim() : "")));
            var ResultDescription = document.createElement("div");
            //ResultDescription.setAttribute("elementName", "ResultDescription");
            ResultDescription.className = "large-3 medium-6 small-6 InspResult column end ";
            ResultDescription.appendChild(document.createTextNode(inspection.ResultDescription.trim()));
            ResultDescription.id = inspection.InspReqID + "_inspection_resultADC";
            // #endregion
            // #region add Remarks Container: add Remarks textarea, button, and radiobutton sections
            //*******************************************************************************
            var addRemarkContainer = document.createElement("div");
            //addRemarkContainer.setAttribute("elementName", "addRemarkContainer");
            addRemarkContainer.className = "large-12 medium-12 small-12 row flex-container align-middle add-remark-container";
            addRemarkContainer.id = inspection.InspReqID + "_add_remark";
            addRemarkContainer.style.display = "none";
            //***************************************
            var addRemark = document.createElement("div");
            addRemark.className = "row large-12 medium-12 small-12 flex-container flex-child-grow";
            var addRemarkLabel = document.createElement("label");
            addRemarkLabel.className = "large-12 medium-12 small-12 row ";
            addRemarkLabel.textContent = "Public Remarks:";
            addRemarkLabel.style.textAlign = "left";
            var addRemarkTextDiv = document.createElement("div");
            addRemarkTextDiv.className = "large-10 medium-8 small-12";
            addRemarkTextDiv.classList.add("flex-container");
            var addRemarkInputGroup = document.createElement("div");
            addRemarkInputGroup.classList.add("input-group");
            addRemarkInputGroup.classList.add("small-12");
            addRemarkInputGroup.style.margin = "0";
            var remarkInput = document.createElement("input");
            remarkInput.type = "text";
            remarkInput.setAttribute("onkeyup", "InspSched.disableSaveCommentButton(" + inspection.InspReqID + ")");
            remarkInput.id = inspection.InspReqID + "_remark_textarea";
            remarkInput.style.margin = "0";
            if (inspection.Remarks) {
                remarkInput.value = inspection.Remarks;
            }
            remarkInput.classList.add("input-group-field");
            remarkInput.classList.add("columns");
            var containerSpan = document.createElement("span");
            containerSpan.classList.add("input-group-button");
            var quickRemarkButton = document.createElement("button");
            quickRemarkButton.classList.add("button");
            quickRemarkButton.classList.add("dropdown");
            quickRemarkButton.classList.add("arrow-only");
            quickRemarkButton.style.borderLeftWidth = "0";
            quickRemarkButton.classList.add("end");
            var eventTarget = document.getElementById("ScrollTab");
            var handler = function handleScrollForRealThisTime() {
                quickRemarkUL.style.display = "none";
                eventTarget.removeEventListener("scroll", handler, false);
                window.removeEventListener("resize", handler, true);
            };
            quickRemarkButton.onclick = function (e) {
                var toggle = quickRemarkUL.style.display === "block";
                if (!toggle) {
                    eventTarget.addEventListener("scroll", handler, false);
                    window.addEventListener("resize", handler, true);
                    var remarkInput_1 = document.getElementById(inspection.InspReqID + "_remark_textarea");
                    quickRemarkUL.style.display = toggle ? "none" : "block";
                    quickRemarkUL.style.width = addRemarkInputGroup.clientWidth.toString() + "px";
                    quickRemarkUL.style.maxWidth = addRemarkInputGroup.clientWidth.toString() + "px";
                    quickRemarkUL.style.left = addRemarkInputGroup.offsetLeft.toString();
                    var windowHeight = window.innerHeight;
                    var bottomHeight = windowHeight - (addRemarkInputGroup.offsetTop + addRemarkInputGroup.clientHeight - eventTarget.scrollTop);
                    var topHeight = addRemarkInputGroup.offsetTop - eventTarget.scrollTop;
                    var leftOffset = addRemarkInputGroup.offsetLeft;
                    console.log('windowHeight: ', windowHeight, 'bottomHeight: ', bottomHeight, 'topHeight: ', topHeight);
                    quickRemarkUL.style.height = "103px";
                    if (bottomHeight < topHeight) {
                        console.log('use top');
                        quickRemarkUL.style.top = (topHeight - 103).toString() + "px";
                        quickRemarkUL.style.left = leftOffset.toString() + "px";
                    }
                    else {
                        console.log('use bottom');
                        quickRemarkUL.style.top = (addRemarkInputGroup.offsetTop + addRemarkInputGroup.clientHeight - eventTarget.scrollTop).toString() + "px";
                        quickRemarkUL.style.left = leftOffset.toString() + "px";
                    }
                }
                else {
                    handler();
                }
            };
            var quickRemarkUL = document.createElement("UL");
            quickRemarkUL.id = "drop" + inspection.InspReqID.toString();
            quickRemarkUL.classList.add("quick-remark-list");
            quickRemarkUL.classList.add("row");
            quickRemarkUL.style.backgroundColor = "white";
            quickRemarkUL.style.display = "none";
            quickRemarkUL.style.position = "fixed";
            var filteredRemarks = InspSched.FilterQuickRemarks(inspection.PermitNo[0], inspection.PrivateProviderInspectionRequestId > 0);
            var _loop_1 = function (qr) {
                var quickRemarkLi = document.createElement("LI");
                var link = document.createElement("a");
                link.onclick = function (e) {
                    return InspSched.UI.SetRemarkText(inspection.InspReqID, qr.Remark);
                };
                link.appendChild(document.createTextNode(qr.Remark));
                quickRemarkLi.appendChild(link);
                quickRemarkUL.appendChild(quickRemarkLi);
            };
            for (var _i = 0, filteredRemarks_1 = filteredRemarks; _i < filteredRemarks_1.length; _i++) {
                var qr = filteredRemarks_1[_i];
                _loop_1(qr);
            }
            containerSpan.appendChild(quickRemarkButton);
            addRemarkInputGroup.appendChild(remarkInput);
            addRemarkInputGroup.appendChild(containerSpan);
            var addRemarkButtonDiv = document.createElement("div");
            //addRemarkButtonDiv.setAttribute("elementName", "addRemarkButtonDiv");
            addRemarkButtonDiv.className = "ButtonContainer column large-2 medium-4 small-12 flex-container align-center flex-child-grow";
            var addRemarkButton = document.createElement("button");
            //addRemarkButton.setAttribute("elementName", "addRemarkButton");
            addRemarkButton.setAttribute("disabled", "disabled");
            addRemarkButton.setAttribute("value", inspection.ResultADC);
            addRemarkButton.id = inspection.InspReqID + "_save_remark_button";
            addRemarkButton.setAttribute("onclick", "(InspSched.UpdateInspection(" + permit.PermitNo + ", " + inspection.InspReqID + "))");
            addRemarkButton.className = "align-self-center columns DetailsButton large-12 medium-12-small-12";
            addRemarkButton.style.margin = "0";
            addRemarkButton.textContent = "Save Result";
            //***************************************
            var radioButtonSection = document.createElement("div");
            //radioButtonSection.setAttribute("elementName", "radioButtonSection");
            radioButtonSection.className = "large-12 medium-12 small-12 column";
            radioButtonSection.style.paddingLeft = "1em";
            // #endregion Remarks Container: add Remarks textarea, button, and radiobutton sections
            // #region Comment Section
            //*********************************************************************************
            var CommentContainer = document.createElement("div");
            CommentContainer.className = "large-12 medium-12 small-12 row flex-container comment-container completed-comments-textarea";
            //CommentContainer.setAttribute("elementName", "CommentContainer");
            CommentContainer.style.display = "none";
            CommentContainer.id = inspection.InspReqID + "_comments";
            var textboxdiv = document.createElement("div");
            //textboxdiv.setAttribute("elementName", "textboxdiv");
            textboxdiv.className = "large-12 medium-12 small-12 row completed-comments-textarea ";
            textboxdiv.style.display = "none";
            textboxdiv.id = inspection.InspReqID.toString() + "_textbox_div";
            var thiscomment = document.createElement("textarea");
            //thiscomment.setAttribute("elementName", "thiscomment");
            thiscomment.id = inspection.InspReqID + "_audit";
            thiscomment.className = "row large-12 medium-12 small-12 No-Edit";
            thiscomment.rows = 4;
            thiscomment.readOnly = true;
            thiscomment.contentEditable = "false";
            thiscomment.style.margin = "0";
            thiscomment.style.overflowY = "scroll";
            thiscomment.style.display = "flex";
            var AddCommentDiv = document.createElement("div");
            //AddCommentDiv.setAttribute("elementName", "AddCommentDiv");
            AddCommentDiv.className = "row large-12 medium-12 small-12 flex-container flex-child-grow";
            AddCommentDiv.style.paddingLeft = "1em";
            var commentlabel = document.createElement("label");
            //commentlabel.setAttribute("elementName", "commentlabel");
            commentlabel.className = "large-12 medium-12 small-12 row ";
            commentlabel.style.textAlign = "left";
            commentlabel.innerText = "Add Comments:";
            var AddCommentTextarea = document.createElement("textarea");
            //AddCommentTextarea.setAttribute("elementName", "AddCommentTextarea");
            AddCommentTextarea.className = "large-10 medium-10 small-12 column Comment-Textarea";
            AddCommentTextarea.style.resize = "none";
            AddCommentTextarea.rows = 3;
            AddCommentTextarea.id = inspection.InspReqID + "_comment_textarea";
            AddCommentTextarea.maxLength = 200;
            var SaveCommentButtonDiv = document.createElement("div");
            //SaveCommentButtonDiv.setAttribute("elementName", "SaveCommentuttonDiv");
            SaveCommentButtonDiv.className = "ButtonContainer column large-2 medium-2 small-12 flex-container align-center";
            var SaveCommentButton = document.createElement("button");
            SaveCommentButton.className = "button align-self-center column small-12 SaveCommentButton";
            //SaveCommentButton.setAttribute("elementName", "SaveCommentButton");
            SaveCommentButton.setAttribute("onclick", "InspSched.SaveComment('" + inspection.InspReqID + "','" + AddCommentTextarea.value + "')");
            SaveCommentButton.textContent = "Save Comment";
            SaveCommentButton.id = inspection.InspReqID + "_save_comment_button";
            //if (inspection.comments.length > 0)
            //{
            //  CommentContainer.appendChild(1234567_textboxdiv);
            //}
            //1234567_commnents.appendChild(AddCommentDiv);
            //AddCommentDiv.appendChild(commentlabel);
            //AddCommentDiv.appendChild(AddCommentTextarea);
            //SaveCommentButtonDiv.appendChild(SaveCommentButton)
            //AddCommentDiv.appendChild(SaveCommentButtonDiv);
            // #endregion Comment Secion
            //*********************************************
            // Set permit number as link if internal user 
            if (permit.access !== InspSched.access_type.public_access) {
                var link = document.createElement("a");
                link.href = permit.Permit_URL;
                link.classList.add('no-underline-for-print');
                link.appendChild(document.createTextNode(inspection.PermitNo));
                permitNumber.appendChild(link);
                //permit.Permit_URL.substring()
            }
            else {
                permitNumber.appendChild(document.createTextNode(inspection.PermitNo));
            }
            // if inspection is incomplete, set date to InspSched, else InspDate
            if (inspection.DisplayInspDateTime.toLowerCase() === 'incomplete') {
                inspDateTime.appendChild(document.createTextNode(inspection.DisplaySchedDateTime));
            }
            else {
                inspDateTime.appendChild(document.createTextNode(inspection.DisplayInspDateTime));
            }
            // #region Initial Append Rows to Inspection Row
            inspectionData.appendChild(permitNumber);
            inspectionData.appendChild(inspDateTime);
            inspectionData.appendChild(inspDesc);
            inspectionData.appendChild(inspector);
            DataRow.appendChild(inspectionData);
            inspRow.appendChild(DataRow);
            if (permit.access != InspSched.access_type.public_access &&
                (InspSched.CanResultBeChanged(inspection.InspDateTime) ||
                    inspection.ResultADC == "" ||
                    inspection.ResultADC == null)) {
                addRemarkTextDiv.appendChild(addRemarkInputGroup);
                addRemarkTextDiv.appendChild(quickRemarkUL);
                addRemarkButtonDiv.appendChild(addRemarkButton);
                addRemark.appendChild(addRemarkLabel);
                addRemark.appendChild(addRemarkTextDiv);
                addRemark.appendChild(addRemarkButtonDiv);
                addRemarkContainer.appendChild(addRemark);
                radioButtonSection.appendChild(BuildRadioButtonRow(inspection.InspReqID.toString(), inspection.ResultADC, permit.access, inspection.PrivateProviderInspectionRequestId));
                addRemarkContainer.appendChild(radioButtonSection);
            }
            // #endregion Initial Append Rows to Inspection Row
            var detailButton = BuildButton(inspection.InspReqID + "_details_btn", "Details", "InspSched.UI.ToggleInspDetails(this.value)", inspection.InspReqID.toString());
            detailButton.className = "column large-12 medium-12 small-12 align-self-center  DetailsButton";
            var buttonDiv = document.createElement("div");
            buttonDiv.className = "row small-12";
            InspButtonContainer.appendChild(buttonDiv);
            //Create function to make New/Cancel/Details Button
            if (permit.ErrorText.length === 0) {
                buttonDiv.appendChild(BuildButton("", "New", "InspSched.UpdatePermitSelectList('" + inspection.PermitNo + "');"));
            }
            else {
                detailButton.style.margin = "0";
            }
            if (permit.access !== InspSched.access_type.public_access) {
                if (inspection.InspReqID !== 0) {
                    buttonDiv.appendChild(detailButton);
                }
            }
            if (inspection.ResultADC.length == 0) {
                if (IsGoodCancelDate(inspection, permit.access)) {
                    if (permit.access === InspSched.access_type.public_access) {
                        var privprovstring = permit.ErrorText.substr(2, 16).toLowerCase();
                        if (privprovstring != "private provider" || inspection.PrivateProviderInspectionRequestId != null) {
                            var cancelButton = BuildButton("", "Cancel", "InspSched.CancelInspection(" + inspection.InspReqID + ", '" + inspection.PermitNo + "');");
                            buttonDiv.appendChild(cancelButton);
                            if (permit.ErrorText.length === 0) {
                                cancelButton.style.marginTop = "6px";
                            }
                        }
                    }
                    else {
                        if (inspection.InspReqID !== 0) {
                            buttonDiv.appendChild(detailButton);
                        }
                    }
                }
            }
            DataRow.appendChild(InspButtonContainer);
            if (inspection.DisplayInspDateTime.length > 0) {
                if (inspection.InspReqID > 0) {
                    CompletedRemarks.appendChild(Remark);
                    CompletedRemarks.appendChild(ResultDescription);
                    // remarks needs to be in the inspection data
                    inspectionData.appendChild(CompletedRemarks);
                }
                else {
                    inspector.style.display = 'none';
                    inspDateTime.style.display = 'none';
                    inspDesc.className = "large-10 medium-6 small-6 InspType InspResult column";
                }
            }
            CommentContainer.appendChild(textboxdiv);
            // SET COMMENTS
            if (inspection.Comment.length > 0) {
                thiscomment.textContent = inspection.Comment;
                textboxdiv.style.display = "flex";
                thiscomment.style.display = "flex";
            }
            textboxdiv.appendChild(thiscomment);
            CommentContainer.appendChild(textboxdiv);
            AddCommentDiv.appendChild(commentlabel);
            AddCommentDiv.appendChild(AddCommentTextarea);
            SaveCommentButtonDiv.appendChild(SaveCommentButton);
            AddCommentDiv.appendChild(SaveCommentButtonDiv);
            CommentContainer.appendChild(AddCommentDiv);
            if (permit.access !== InspSched.access_type.public_access) {
                DetailsContainer.appendChild(addRemarkContainer);
                DetailsContainer.appendChild(CommentContainer);
            }
            inspRow.appendChild(DetailsContainer);
            return inspRow;
        }
        function CheckBrowser() {
            var browser = "";
            if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
                browser = 'Opera';
            }
            else if (navigator.userAgent.indexOf("Chrome") != -1) {
                browser = 'Chrome';
            }
            else if (navigator.userAgent.indexOf("Safari") != -1) {
                browser = 'Safari';
            }
            else if (navigator.userAgent.indexOf("Firefox") != -1) {
                browser = 'Firefox';
            }
            else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) {
                browser = 'IE';
            }
            else {
                browser = 'unknown';
            }
            return browser;
        }
        function BuildButton(buttonId, label, functionCall, value) {
            var InspButton = document.createElement("button");
            if (buttonId.length > 0) {
                InspButton.id = buttonId;
            }
            InspButton.value = "";
            InspButton.className = "column large-12 medium-12 small-12 align-self-center  NewInspButton";
            InspButton.appendChild(document.createTextNode(label));
            InspButton.setAttribute("onclick", functionCall);
            InspButton.value = (value == null ? "" : value);
            return InspButton;
        }
        function BuildRadioButtonRow(InspectionId, checked, access, privateProvidercheck) {
            var RadioButtonSubrow = document.createElement("div");
            if (access === InspSched.access_type.inspector_access) {
                RadioButtonSubrow.className = "large-10 medium-10 small-12 flex-container flex-dir-row flex-child-grow align-justify row";
                RadioButtonSubrow.id = InspectionId + "_radio_list";
                var approveradio = document.createElement("input");
                approveradio.id = (privateProvidercheck > 0 ? "perform" : "approve") + "_selection";
                approveradio.type = "radio";
                approveradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
                if (checked == "A" || checked == "P") {
                    approveradio.checked = true;
                }
                approveradio.name = InspectionId + "_results";
                approveradio.value = (privateProvidercheck > 0 ? "P" : "A");
                var approve = document.createElement("label");
                approve.className = "column large-2 small-6";
                approve.htmlFor = (privateProvidercheck > 0 ? "perform" : "approve") + "_selection";
                approve.appendChild(approveradio);
                approve.appendChild(document.createTextNode(privateProvidercheck > 0 ? "Performed" : "Approved"));
                var disapproveradio = document.createElement("input");
                disapproveradio.id = (privateProvidercheck > 0 ? "not_performed" : "disapprove") + "_selection";
                disapproveradio.type = "radio";
                disapproveradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
                if (checked == "D" || checked == "N") {
                    disapproveradio.checked = true;
                }
                disapproveradio.name = InspectionId + "_results";
                disapproveradio.value = (privateProvidercheck > 0 ? "N" : "D");
                var disapprove = document.createElement("label");
                disapprove.className = "column large-2 small-6";
                disapprove.htmlFor = (privateProvidercheck > 0 ? "not_performed" : "disapprove") + "_selection";
                disapprove.appendChild(disapproveradio);
                disapprove.appendChild(document.createTextNode(privateProvidercheck > 0 ? "Not Performed" : "Disapproved"));
                RadioButtonSubrow.appendChild(approve);
                RadioButtonSubrow.appendChild(disapprove);
            }
            else {
                RadioButtonSubrow.className = "large-10 medium-10 small-12 flex-container flex-dir-row flex-child-grow align-right";
            }
            var cancelradio = document.createElement("input");
            cancelradio.id = "cancelradio_selection";
            cancelradio.type = "radio";
            cancelradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
            if (checked == "C") {
                cancelradio.checked = true;
            }
            cancelradio.name = InspectionId + "_results";
            cancelradio.value = "C";
            var cancel = document.createElement("label");
            cancel.className = "column large-2 small-6";
            cancel.htmlFor = "cancelradio_selection";
            cancel.appendChild(cancelradio);
            cancel.appendChild(document.createTextNode("Cancel"));
            var incompleteradio = document.createElement("input");
            incompleteradio.id = "incompleteradio_selection";
            incompleteradio.type = "radio";
            incompleteradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
            if (checked == "") {
                incompleteradio.checked = true;
            }
            incompleteradio.name = InspectionId + "_results";
            incompleteradio.value = "";
            var incomplete = document.createElement("label");
            incomplete.className = "column large-2 small-6";
            incomplete.htmlFor = "incompleteradio_selection";
            incomplete.appendChild(incompleteradio);
            incomplete.appendChild(document.createTextNode("Incomplete"));
            RadioButtonSubrow.appendChild(cancel);
            RadioButtonSubrow.appendChild(incomplete);
            return RadioButtonSubrow;
        }
        /**********************************************
         *
         * Build Scheduler
         * Get and build select list of inspections@
         *
         *********************************************/
        function BuildScheduler(inspections, key) {
            // Populate Inspection Type Select list
            LoadInspTypeSelect(key);
            InspSched.BuildCalendar(InspSched.ThisPermit.ScheduleDates, InspSched.ThisPermit.ErrorText);
            document.getElementById('InspectionScheduler').setAttribute("value", key);
        }
        UI.BuildScheduler = BuildScheduler;
        function LoadInspTypeSelect(key) {
            var thistype = key[0];
            var label = getInspTypeString(thistype);
            var InspTypeList = document.getElementById('InspTypeSelect');
            var optionLabel = document.createElement("option");
            clearElement(InspTypeList);
            optionLabel.appendChild(document.createTextNode(label + " Inspections:"));
            optionLabel.className = "selectPlaceholder";
            optionLabel.selected;
            optionLabel.value = "";
            InspTypeList.appendChild(optionLabel);
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === key; })[0];
            var filteredInspectionTypes = InspSched.InspectionTypes.filter(function (inspectionType) {
                if (inspectionType.InspCd[0] === thistype) {
                    if (permit.NoFinalInspections) {
                        return !inspectionType.Final;
                    }
                    else {
                        return true;
                    }
                }
            });
            //for (let type of InspSched.InspectionTypes)
            for (var _i = 0, filteredInspectionTypes_1 = filteredInspectionTypes; _i < filteredInspectionTypes_1.length; _i++) {
                var type = filteredInspectionTypes_1[_i];
                if (type.InspCd[0] == thistype) {
                    var option = document.createElement("option");
                    option.label = type.InsDesc;
                    option.value = type.InspCd;
                    option.className = "TypeSelectOption";
                    option.appendChild(document.createTextNode(type.InsDesc));
                    InspTypeList.appendChild(option);
                }
            }
        }
        UI.LoadInspTypeSelect = LoadInspTypeSelect;
        /**********************************
        
          Do Somethings
        
        ***********************************/
        function getInspTypeString(InspType) {
            switch (InspType) {
                case "1":
                case "0":
                case "9":
                    return "Building";
                case "2":
                    return "Electrical";
                case "3":
                    return "Plumbing";
                case "4":
                    return "Mechanical";
                case "6":
                    return "Fire";
                default:
                    return "Unknown";
            }
        }
        function Show(id, element, displayType) {
            if (!element) {
                var e = document.getElementById(id);
                if (e.style.display != null) {
                    if (displayType == null)
                        e.style.display = "flex";
                    else
                        e.style.display = displayType;
                }
            }
            else {
                var e = document.getElementById(id);
                if (displayType == null)
                    element.style.display = "flex";
                else
                    element.style.display = displayType;
            }
        }
        UI.Show = Show;
        function Hide(id) {
            var e = document.getElementById(id);
            if (e)
                e.style.display = "none";
        }
        UI.Hide = Hide;
        // this function emptys an element of all its child nodes.
        function clearElement(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
        UI.clearElement = clearElement;
        function ShowTable(key, permits) {
            var inspectionTable = document.getElementById('InspectionTable');
            if (permits) {
                Hide('Searching');
                inspectionTable.style.removeProperty("display");
            }
        }
        function UpdateSearchFailed(key) {
            var e = document.getElementById('SearchFailed');
            clearElement(e);
            var message = document.createElement("h3");
            if (!isNaN(Number(key)) && key.length == 8) {
                message.appendChild(document.createTextNode("Permit #" + key + " not found"));
            }
            else if (!isNaN(Number(key)) && key.length > 0 && key.length != 8) {
                message.innerHTML = "\"" + key + "\" is not a valid Permit Number";
            }
            else if (key.length == 0) {
                message.innerHTML = "You did not enter any information.<br />Enter a valid permit number and click search.";
            }
            else {
                message.innerHTML = "Invalid Entry<br />";
            }
            message.style.textAlign = "center";
            e.appendChild(message);
            Hide('Searching');
            Show('SearchFailed');
        }
        function InformUserOfError(permitno, error) {
            Hide("InspectionScheduler");
            clearElement(document.getElementById('InspTypeSelect'));
            var reasons = document.getElementById('Reasons');
            clearElement(reasons);
            var thisHeading = document.getElementById('ErrorHeading');
            clearElement(thisHeading);
            var IssueList = document.createElement('ul');
            IssueList.classList.add('column');
            IssueList.classList.add('small-12');
            IssueList.classList.add('align-center');
            var thisIssue = document.createElement('li');
            thisHeading.appendChild(document.createTextNode("The following issue is preventing the ability to schedule an inspection:"));
            thisIssue.appendChild(document.createTextNode(error));
            thisIssue.style.marginLeft = "2rem;";
            IssueList.appendChild(thisIssue);
            reasons.appendChild(IssueList);
            var permitCheck = error.substr(8, 8);
            if (InspSched.ThisPermit.access != InspSched.access_type.public_access &&
                permitCheck == permitno &&
                (error.substr(30, 5) == 'holds' || error.substr(30, 5) == 'charg')) {
                IssueList.classList.remove('small-12');
                IssueList.classList.add('small-9');
                reasons.appendChild(CreateButtonToIMS(permitno, error));
            }
            document.getElementById("NotScheduled").style.display = "flex";
        }
        UI.InformUserOfError = InformUserOfError;
        function CreateButtonToIMS(permitNumber, error) {
            var label = "";
            var imsLink = "";
            var isHold = true;
            var buttonDiv = document.createElement('div');
            buttonDiv.classList.add('column');
            buttonDiv.classList.add('small-2');
            buttonDiv.classList.add('flex-container');
            buttonDiv.classList.add('align-center');
            switch (error.substr(30, 6)) {
                case "holds,":
                    label = "IMS Holds";
                    isHold = true;
                    break;
                case "charge":
                    label = "IMS Charges";
                    isHold = false;
                    break;
                default:
                    return buttonDiv;
            }
            var linkButton = document.createElement('button');
            linkButton.classList.add('small-8');
            linkButton.classList.add('align-self-center');
            linkButton.classList.add('button');
            linkButton.classList.add('DetailsButton');
            linkButton.value = isHold ? 'hold' : 'charge';
            linkButton.setAttribute('onclick', 'InspSched.SendToIMS(' + permitNumber + ', this.value)');
            linkButton.appendChild(document.createTextNode(label));
            buttonDiv.appendChild(linkButton);
            return buttonDiv;
        }
        function IsGoodCancelDate(inspection, access) {
            var tomorrow = new Date();
            var inspDate = new Date(inspection.DisplaySchedDateTime);
            var dayOfMonth = tomorrow.getDate() + 1;
            if (inspDate < tomorrow && (access == InspSched.access_type.public_access))
                return false;
            return true;
        }
        function ToggleInspDetails(InspectionId) {
            var current = InspSched.CurrentInspections.filter(function (j) { return j.InspReqID === parseInt(InspectionId); });
            if (current.length === 0) {
                console.log('an error occurred, the inspection you are looking for was not found in the current inspections.');
                return;
            }
            if (InspSched.UI.CurrentDetailsOpen != "" &&
                InspectionId != InspSched.UI.CurrentDetailsOpen) {
                var CurrentAddRemark = document.getElementById(InspSched.UI.CurrentDetailsOpen + '_add_remark');
                var CurrentCompletedRemark = document.getElementById(InspSched.UI.CurrentDetailsOpen + '_completed_remark');
                var CurrentComments = document.getElementById(InspSched.UI.CurrentDetailsOpen + '_comments');
                CurrentAddRemark.style.display = "none";
                CurrentComments.style.display = "none";
                if (CurrentCompletedRemark != null) {
                    CurrentCompletedRemark.style.display = "flex";
                }
                document.getElementById(InspSched.UI.CurrentDetailsOpen + '_details_btn').textContent = "Details";
            }
            var addRemark = document.getElementById(InspectionId + '_add_remark');
            var completedRemark = document.getElementById(InspectionId + '_completed_remark');
            var comments = document.getElementById(InspectionId + '_comments');
            var button = document.getElementById(InspectionId + '_details_btn');
            var inspectionDate = new Date(current[0].InspDateTime.toString());
            var d = new Date();
            var priorDate = new Date();
            priorDate.setDate(priorDate.getDate() - 2);
            var elementState = comments.style.display.toString().toLowerCase();
            if ((inspectionDate > priorDate &&
                addRemark != null) || current[0].ResultADC === "") {
                completedRemark.style.display = elementState == 'flex' ? 'flex' : 'none';
                addRemark.style.display = elementState == 'none' ? 'flex' : 'none';
            }
            if (comments != null) {
                comments.style.display = elementState == 'none' ? 'flex' : 'none';
            }
            var buttonString = (elementState == 'none' ? 'Hide ' : '') + 'Details';
            document.getElementById(InspectionId + '_details_btn').textContent = buttonString;
            InspSched.UI.CurrentDetailsOpen = InspectionId;
        }
        UI.ToggleInspDetails = ToggleInspDetails;
        function SetRemarkText(InspectionId, Remark) {
            var ul = document.getElementById("drop" + InspectionId.toString());
            var input = document.getElementById(InspectionId.toString() + "_remark_textarea");
            input.value = Remark;
            ul.style.display = "none";
            return true;
        }
        UI.SetRemarkText = SetRemarkText;
    })(UI = InspSched.UI || (InspSched.UI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=ui.js.map