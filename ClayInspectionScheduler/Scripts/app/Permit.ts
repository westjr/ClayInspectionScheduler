﻿/// <reference path="transport.ts" />
/// <reference path="ui.ts" />


namespace InspSched 
{

  interface IPermit 
  {
      IsExternalUser: boolean;

    PermitNo: string;
    ProjAddrCombined: string;
    ProjCity: string;
    Confidential: number;
    ErrorText: string;
    NoFinalInspections: boolean;
    ScheduleDates: string[];
    URL: string;


  }

  export class Permit implements IPermit 
  {
    public IsExternalUser: boolean = true;
    public PermitNo: string;
    public ProjAddrCombined: string;
    public ProjCity: string;
    public Confidential: number;
    public ErrorText: string;
    public NoFinalInspections: boolean;
    public ScheduleDates: string[];
    public URL: string;
    constructor( IsExternalUser: boolean) 
    {

    }

  }
}