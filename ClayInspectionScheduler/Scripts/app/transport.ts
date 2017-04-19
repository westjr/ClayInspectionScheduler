﻿/// <reference path="XHR.ts" />
/// <reference path="Permit.ts" />
/// <reference path="Inspection.ts" />

namespace InspSched.transport
{
    "use strict"


    export function GetPermit(key: string): Promise<Array<Permit>>
    {
        var x = XHR.Get("API/Permit/" + key);
        return new Promise<Array<Permit>>(function(resolve, reject)
        {
            x.then(function(response)
            {
                let pl: Array<Permit> = JSON.parse(response.Text);
                resolve(pl);
            }).catch(function()
            {
                console.log("error in GetPermit");
                reject(null);
            });
        });
    }

    export function GetInspType()
    {
        var x = XHR.Get("API/InspType/");
        return new Promise<Array<InspType>>(function(resolve, reject) {
            x.then(function(response) {
                let pl: Array<InspType> = JSON.parse(response.Text);
                resolve(pl);
            }).catch(function() {
                console.log("error in GetInspTypeList");
                reject(null);
            });
        });
    }
 
    export function GetInspections(key: string): Promise<Array<Inspection>> {

        var x = XHR.Get("API/Inspection/" + key);
        return new Promise<Array<Inspection>>(function(resolve, reject) {
            x.then(function(response) {

                let il: Array<Inspection> = JSON.parse(response.Text);
                resolve(il);

            }).catch(function() {
                console.log("error in GetInspections");
                reject(null);

            });
        });
    }

    export function SaveInspection( thisInspection: NewInspection )
    {
      let data: string =
        thisInspection.PermitNo + "," +
        thisInspection.InspectionCd + "," +
        thisInspection.SchecDateTime;

      var x = XHR.Post( "API/NewInspection/", data );
      return new Promise( function ( resolve, reject )
      {
        x.then( function ( response )
        {
          var di = JSON.parse( response.Text );
          UI.GetInspList( thisInspection.PermitNo );
          resolve( di );

        }).catch( function ()
        {
          console.log( "error in GetInspections" );
          UI.GetInspList( thisInspection.PermitNo );
          reject( null );
        });



      });

    }

    export function CancelInspection(InspID: string, key: string) {
        var x = XHR.Delete("API/Inspection/" + key + "/" + InspID);
        return new Promise(function(resolve, reject) {
            x.then(function(response) {
                var di = JSON.parse(response.Text);
                resolve(di);

            }).catch(function() {
                console.log("error in GetInspections");
                reject(null);
            });
        });
    }


    export function GenerateDates() {
        var x = XHR.Get("API/Dates/");
        return new Promise(function(resolve, reject) {
            x.then(function(response) {
                var di = JSON.parse(response.Text);
                resolve(di);

            }).catch(function() {
                console.log("error in CheckContractorPermitStatus");
                reject(null);
            });
        });

    }


}

