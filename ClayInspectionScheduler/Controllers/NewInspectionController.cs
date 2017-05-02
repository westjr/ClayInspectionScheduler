﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
    public class NewInspectionController : ApiController
    {
      public IHttpActionResult Post( NewInspection thisInspection)
      {
      
        List<string> lp = NewInspection.Post( thisInspection );
        if( lp == null)
        {
          return InternalServerError();
        }
        else
        {
          return Ok( lp );
        }

      }
  }
}