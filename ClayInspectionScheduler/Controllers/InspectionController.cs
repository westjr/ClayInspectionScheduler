﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;


namespace ClayInspectionScheduler.Controllers
{
  [RoutePrefix("API/Inspection")]
  public class InspectionController : ApiController
  {
    [HttpGet]
    [Route("Permit/{PermitNumber}")]
    public IHttpActionResult Permit(string PermitNumber)
    {
      List<Inspection> lp = Inspection.Get(PermitNumber);
      if (lp == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(lp);
      }
    }

    // Calls a function to set the result of an inspection
    [HttpPost]
    [Route("Comment")]
    public IHttpActionResult Comment(dynamic CommentData)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      var i = Inspection.AddComment((int)CommentData.InspectionId, (string)CommentData.Comment, ua);

      if (i != null)
      {
        return Ok(i);
      }
      else
      {
        return InternalServerError();
      }

    }

    [HttpPost]
    [Route("Update")]
    public IHttpActionResult Update(dynamic InspectionData)
    {

      //string permitNumber,
      //int inspectionId,
      //string resultCode,
      //string remark,
      //string comment
      var ua = UserAccess.GetUserAccess(User.Identity.Name);

      var sr = Inspection.UpdateInspectionResult(
        (string)InspectionData.permitNumber,
        (int)InspectionData.inspectionId,
        (string)InspectionData.resultCode,
        (string)InspectionData.remark,
        (string)InspectionData.comment,
        ua);

      return Ok(sr);
    }

    [HttpPost]
    [Route("PublicCancel/{permitNumber}/{inspectionId}")]
    public IHttpActionResult PublicCancel(string permitNumber, int inspectionId)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);

      var sr = Inspection.UpdateInspectionResult(
        permitNumber.Trim(),
        inspectionId,
        "C",
        "",
        "",
        ua);

      return Ok(sr);
    }

    [HttpGet]
    [Route("List")]
    public IHttpActionResult List()
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if(ua.current_access == UserAccess.access_type.inspector_access)
      {
        return Ok(Inspection.GetInspectorList());
      }
      else
      {
        var l = new List<Inspection>();
        return Ok(l);

      }
    }

  }
}
