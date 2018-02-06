﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Routing;


namespace ClayInspectionScheduler
{
  public class WebApiApplication :System.Web.HttpApplication
  {
    protected void Application_Start()
    {

      GlobalConfiguration.Configure( WebApiConfig.Register );
#if !DEBUG
      Models.InspType.GetCachedInspectionTypes();
#endif
    }
  }
}
