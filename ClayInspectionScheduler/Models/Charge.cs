﻿using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;
using System.Collections;

namespace ClayInspectionScheduler.Models
{


  public class Charge
  {

    public string PermitNo { get; set; }
    public string CashierId { get; set; } = "";
    public string CatCode { get; set; }
    public string Description { get; set; }
    public decimal Total { get; set; }
    public int OTid { get; set; } = -1;
    public string PmtType { get; set; } = "";
    public string PropUseCode { get; set; } = "";
    public bool ImpactFee_Relevant { get; set; } = false;


    public Charge()
    {


    }

    public static List<Charge> GetCharges(string PermitNumber, bool tryingToScheduleFinal = false)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNumber", PermitNumber);

      var sql = @"
      USE WATSC; 

      SELECT
        -- RTRIM(LTRIM(C.AssocKey)) PermitNo,
        C.CashierId,
        LTRIM(RTRIM(C.CatCode)) CatCode,
        CC.[Description] Description,
        C.Total,
        CC.ImpactFee_Relevant
      FROM ccCashierItem C
      INNER JOIN ccCatCd CC ON C.CatCode = CC.CatCode
      WHERE TOTAL > 0
        AND CashierId IS NULL
        AND UnCollectable = 0
        AND AssocKey = @PermitNumber
      ";

      try
      {

        var charges = Constants.Get_Data<Charge>(sql, dbArgs);

        if (!tryingToScheduleFinal)
        {
          charges.RemoveAll(x => x.CatCode.Trim() == "RCA" ||
                                 x.CatCode.Trim() == "XRCA" || 
                                 x.CatCode.Trim() == "CLA" ||
                                 x.CatCode.Trim() == "XCLA" );
        }

        foreach (var c in charges)
        {
          c.Total = decimal.Round(c.Total, 2, MidpointRounding.AwayFromZero);
        }


        return charges;

      }
      catch (Exception ex)
      {
        Constants.Log(ex, $@"Issue in function
                            Charge.GetCharges(PermitNumber {PermitNumber}, TryingToScheduleFinal {tryingToScheduleFinal.ToString()})

                             " + sql);
        return new List<Charge>();
      }
    }

  }
}