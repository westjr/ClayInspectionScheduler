/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />
/// <reference path="inspectorui.ts" />
/// <reference path="inspectorview.ts" />
/// <reference path="inspector.ts" />

namespace InspSched
{
  "use strict";

  let dpCalendar = null;
  export let InspectionTypes: Array<InspType> = [];
  export let newInsp: NewInspection;
  export let CurrentPermits: Array<Permit> = [];
  export let CurrentInspections: Array<Inspection> = [];
  export let IssuesExist: Array<string> = [];
  export let ThisPermit: Permit;
  export let IVInspections: Array<Inspection> = [];
  export let Inspectors: Array<Inspector> = [];
  export let IV: Array<InspectorView> = [];  // this is going to be the processed array of Inspection data.

  let InspectionTable = <HTMLDivElement>document.getElementById('InspectionTable');
  let InspectionTypeSelect = <HTMLSelectElement>document.getElementById("InspTypeSelect");
  let PermitSearchButton = <HTMLButtonElement>document.getElementById("PermitSearchButton");
  let CloseIssueDivButton = <HTMLButtonElement>document.getElementById("CloseIssueList");
  let PermitSearchField = <HTMLInputElement>document.getElementById("PermitSearch");
  let permitNumSelect = <HTMLSelectElement>document.getElementById("PermitSelect");
  let inspScheduler = document.getElementById("InspectionScheduler");
  let IssueContainer: HTMLDivElement = (<HTMLDivElement>document.getElementById("NotScheduled"));
  let IssuesDiv: HTMLDivElement = (<HTMLDivElement>document.getElementById('Reasons'));
  let SaveInspectionButton = document.getElementById("SaveSchedule");
  let confirmed = document.getElementById('SaveConfirmed');


  export function start(): void
  {
    LoadData();
    window.onhashchange = HandleHash;
    if (location.hash.substring(1).length > 0) HandleHash(); // if they pass something in the URL
  } //  END start()

  export function updateHash(permit: string)
  {
    let hash = new LocationHash(location.hash.substring(1));
    location.hash = hash.UpdatePermit(permit);
    let newhash = new LocationHash(location.hash.substring(1));
    if (newhash.Permit === hash.Permit)
    {
      SearchPermit();
    }
  }

  export function HandleHash()
  {
    let hash = location.hash;
    let currentHash = new LocationHash(location.hash.substring(1));
    if (currentHash.Permit.length > 0)
    {
      // if they entered a permit number, let's try and search for it
      // do permitsearch here
      PermitSearchField.value = currentHash.Permit.trim();
      SearchPermit();
    }
  }

  PermitSearchField.onkeydown = function (event)
  {
    if (event.keyCode == 13)
    {
      //SearchPermit();
      updateHash(PermitSearchField.value);
    }
  };

  export function SearchPermit()
  {
    InspSched.UI.CurrentDetailsOpen = "";
    InspectionTable.style.display = "none";
    UI.Hide('SaveConfirmed');

    UI.Hide('NotScheduled');

    $('#InspectionSchedulerTabs').foundation('selectTab', 'InspectionView', true);

    let permitno: string = PermitSearchField.value.trim()
    transport.GetPermit(InspSched.UI.Search(permitno)).then(function (permits: Array<Permit>)
    {
      console.log(permits);

      InspSched.CurrentPermits = permits;

      InspSched.UI.ProcessResults(permits, permitno);

      for (let permit of permits)
      {
        if (permit.PermitNo == permitno)
        {
          console.log('our permits match');
          InspSched.ThisPermit = permit;
          if (permit.ErrorText.length === 0)
          {
            console.log('build this calendar, yall');
            BuildCalendar(permit.ScheduleDates);
          }

          else
          {
            InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);
          }
          break;
        }
      }

      return true;

    },
      function ()
      {

        console.log('error getting permits');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        InspSched.UI.Hide('Searching');

        return false;
      });


  }

  permitNumSelect.onchange = function ()
  {
    $(dpCalendar).datepicker('destroy');

    IssueContainer.style.display = 'none';
    confirmed.style.display = "none";
    let permits = InspSched.CurrentPermits;
    // TODO: Add code to check if there is a selected date;
    SaveInspectionButton.setAttribute("disabled", "disabled");

    for (let permit of permits)
    {
      if (permit.PermitNo == permitNumSelect.value)
      {
        // THIS LINE FOR TESTING ONLY
        permit.access = access_type.inspector_access;

        InspSched.ThisPermit = permit;

        if (permit.ErrorText.length > 0)
        {
          InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);

        }
        else
        {
          InspSched.UI.LoadInspTypeSelect(permit.PermitNo);
          BuildCalendar(permit.ScheduleDates);

        }
        break;
      }
    }
  }

  InspectionTypeSelect.onchange = function ()
  {

    SaveInspectionButton.setAttribute("value", InspectionTypeSelect.value);
    if ($(dpCalendar).data('datepicker').getDate() != null)
    {
      SaveInspectionButton.removeAttribute("disabled");
    }
  }

  SaveInspectionButton.onclick = function ()
  {
    inspScheduler.style.display = "none";
    confirmed.style.display = "none";
    IssueContainer.style.display = "none";
    InspSched.UI.clearElement(IssuesDiv);

    let thisPermit: string = permitNumSelect.value;
    let thisInspCd: string = SaveInspectionButton.getAttribute("value");
    let thisInspDesc: HTMLSelectElement = (<HTMLSelectElement>document.getElementById("InspTypeSelect"));
    let inspDesc: string = thisInspDesc.options[thisInspDesc.selectedIndex].textContent;
    let comment: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById("scheduler_comment"));



    newInsp = new NewInspection(thisPermit, thisInspCd, $(dpCalendar).data('datepicker').getDate(), comment.value);
    comment.value = "";

    var e = transport.SaveInspection(newInsp).then(function (issues: Array<string>)
    {

      let thisHeading: HTMLHeadingElement = (<HTMLHeadingElement>document.getElementById('ErrorHeading'));
      let IssueList: HTMLUListElement = (<HTMLUListElement>document.createElement('ul'));
      if (issues.length === 0) issues.push("A system error has occurred. Please check your request and try again.");
      if (issues[0].toLowerCase().indexOf("inspection has been scheduled") === -1) 
      {

        InspSched.UI.clearElement(thisHeading);
        thisHeading.appendChild(document.createTextNode("The following issue(s) prevented scheduling the requested inspection:"));

        for (let i in issues)
        {
          let thisIssue: HTMLLIElement = (<HTMLLIElement>document.createElement('li'));
          thisIssue.appendChild(document.createTextNode(issues[i]));
          thisIssue.style.marginLeft = "2rem;";
          IssueList.appendChild(thisIssue);

        }

        IssuesDiv.appendChild(IssueList);
        IssueContainer.style.display = "flex";

      }
      else
      {
        let savesuccess: HTMLParagraphElement = (<HTMLParagraphElement>document.getElementById("SaveConfirmed"));
        if (savesuccess)
        {
          InspSched.UI.clearElement(savesuccess);

        }
        savesuccess.appendChild(document.createTextNode(issues[0]));
        document.getElementById("SaveConfirmed").style.display = "flex";
      }

      return true;

    }, function ()
      {
        console.log('error in Saving Inspection');
        return false;
      });

    if (IssuesExist.length > 0)
      IssueContainer.style.display = 'flex';

    InspSched.UI.GetInspList(thisPermit);
  }

  CloseIssueDivButton.onclick = function ()
  {
    IssueContainer.style.display = "none";
  }

  function LoadData()
  {
    SaveInspectionButton.setAttribute("disabled", "disabled");
    IssueContainer.style.display = "none";
    LoadInspectionTypes();
    InspectorUI.LoadDailyInspections();

  }

  function LoadInspectionTypes()
  {

    transport.GetInspType().then(function (insptypes: Array<InspType>)
    {
      console.log('inspection types', insptypes);
      InspSched.InspectionTypes = insptypes;


    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspSched.InspectionTypes = [];
      });
  }

  export function BuildCalendar(dates: Array<string>, errorText: string = "")
  {
    $(dpCalendar).datepicker('destroy');

    if (errorText.length === 0)
    {

      dpCalendar = $('#sandbox-container div').datepicker(
        <DatepickerOptions>
        {
          startDate: InspSched.ThisPermit.Dates.minDate_string,
          datesDisabled: InspSched.ThisPermit.Dates.badDates_string,
          endDate: InspSched.ThisPermit.Dates.maxDate_string,
          maxViewMode: 0,
          toggleActive: true,

        })
      {
        $(dpCalendar).on('changeDate', function ()
        {

          let date = $(dpCalendar).data('datepicker').getDate();
          //return false;
          $('change-date').submit();

          EnableSaveButton();
        });

      };

      document.getElementById('InspectionScheduler').style.display = "flex";
    }



  }

  function EnableSaveButton()
  {
    {
      if (InspectionTypeSelect.value != "" && $(dpCalendar).data('datepicker').getDate() != null)
      {
        SaveInspectionButton.removeAttribute("disabled");
      }
      else
      {
        SaveInspectionButton.setAttribute("disabled", "disabled");
      }
    }
  }

  export function disableSaveCommentButton(InspectionRequestId: string)
  {
    let commentButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_comment_button"));
    let remarkButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_remark_button"));

    let currentResult = remarkButton.value;

    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_remark_textarea"));

    let value: string = (<HTMLInputElement>document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked')).value;

    if (value == currentResult && remarkTextarea.value != "")
    {
      commentButton.removeAttribute("disabled");
    }
    else
    {
      commentButton.setAttribute("disabled", "disabled");
    }
    if (remarkButton !== null)
    {
      enableSaveResultButton(InspectionRequestId);
    }
    
  }

  export function enableSaveResultButton(InspectionRequestId: string)
  {
    let remarkButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_remark_button"));
    let commentButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_comment_button"));

    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_remark_textarea"));

    let value: string = (<HTMLInputElement>document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked')).value;

    switch (value)
    {
      case "A":
        remarkButton.removeAttribute("disabled");
        return;
      case "P":
      case "D":
      case "N":
      case "C":
        if (remarkTextarea.value != "")
        {
          remarkButton.removeAttribute("disabled");
        }
        else
        {
          remarkButton.setAttribute("disabled", "disabled");
          if (value == remarkButton.value && remarkTextarea.value == "")
          {
            commentButton.removeAttribute("disabled");
          }
          else
          {
            commentButton.setAttribute("disabled", "disabled");
          }
        }
        return;
      default:
        if (remarkTextarea.value == "" && remarkButton.value == value)
        {
          commentButton.removeAttribute("disabled");
          remarkButton.setAttribute("disabled", "disabled");
        }
        else
        {
          commentButton.setAttribute("disabled", "disabled");
          remarkButton.removeAttribute("disabled");

        }
        return;
    }

  }

  export function UpdatePermitSelectList(PermitNo: string): void
  {
    document.getElementById("NotScheduled").style.display = "none";

    document.getElementById("SaveConfirmed").style.display = "none";

    let selectedoption: HTMLOptionElement = (<HTMLOptionElement>document.getElementById("select_" + PermitNo));

    selectedoption.selected = true;

    for (let permit of InspSched.CurrentPermits)
    {
      if (permit.PermitNo == permitNumSelect.value)
      {
        InspSched.ThisPermit = permit;
        InspSched.UI.LoadInspTypeSelect(permit.PermitNo);
        InspSched.UI.BuildScheduler(InspSched.CurrentInspections, permit.PermitNo);
      }
    }


    if ($('#sandbox-container div').data('datepicker') != null && $('#sandbox-container div').data('datepicker') != undefined)
      $('#sandbox-container div').data('datepicker').clearDates();



    $('#InspectionSchedulerTabs').foundation('selectTab', 'Scheduler', true);

    // clears Calendar of any chosen dates
  }

  export function SaveComment(InspectionRequestId: string)
  {
    let commentTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_comment_textarea"));
    let completedComments: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_audit"));
    let NewComment = commentTextarea.value;

    transport.AddComment(parseInt(InspectionRequestId), NewComment).then(function (inspection: Inspection)
    {
      completedComments.value = inspection.Comment;
      commentTextarea.value = "";

    }, function ()
      {
        console.log("error in SaveComment");


      });
  }

  export function UpdateInspection(permitNumber: string, InspectionRequestId: string)
  {
    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_remark_textarea"));
    let commentTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_comment_textarea"));
    let value: string = (<HTMLInputElement>document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked')).value;



    console.log("value: ", value);

    let remarkText = remarkTextarea.value;

    console.log("remarkText: ", remarkText);

    let commentText = commentTextarea.value;

    console.log("commentText: ", commentText);
    let inspReqIdAsNum = parseInt(InspectionRequestId);

    transport.UpdateInspection(permitNumber, inspReqIdAsNum, value, remarkText, commentText).then(function ()
    {
      SearchPermit();

    }, function ()
      {
        console.log('error in UpdateInspection');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        SearchPermit();
      });

    InspSched.UI.ToggleInspDetails(InspectionRequestId);

    remarkTextarea.value = "";
    commentTextarea.value = "";

    // This will be updated to take inspection data returned from server and update the inspection to show new data.


  }

  export function CancelInspection(InspID?: number, PermitNo?: string)
  {

    document.getElementById('NotScheduled').style.display = "none";

    if (InspID != null && PermitNo != null)
    {
      //Hide( 'FutureInspRow' );
      // TODO: Add function to not allow cancel if scheduled date of insp is current date 

      var isDeleted = transport.CancelInspection(InspID, PermitNo);

      // TODO: ADD code to inform user if the inspection has been deleted 

      // Reload inspection list after delete
      if (isDeleted)
      {
        InspSched.UI.GetInspList(PermitNo);
        BuildCalendar(InspSched.ThisPermit.ScheduleDates);
      }

      else
      {
        //display notification of failed delete

      }
    }
  }

}
