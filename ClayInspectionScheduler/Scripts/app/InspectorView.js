/// <reference path="shortinspection.ts" />
var InspSched;
(function (InspSched) {
    var InspectorView = /** @class */ (function () {
        function InspectorView(inspection) {
            if (inspection === void 0) { inspection = null; }
            this.PermitNumber = "";
            this.Address = "";
            this.GeoZone = "";
            this.FloodZone = "";
            this.Inspector = "";
            this.IsPrivateProvider = false;
            this.Inspections = [];
            if (inspection !== null) {
                this.PermitNumber = inspection.PermitNo;
                this.Address = inspection.StreetAddress;
                this.FloodZone = inspection.FloodZone;
                this.GeoZone = inspection.GeoZone;
                this.Inspector = inspection.InspectorName;
                this.IsPrivateProvider = inspection.PrivateProviderInspectionRequestId > 0;
            }
        }
        return InspectorView;
    }());
    InspSched.InspectorView = InspectorView;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=inspectorview.js.map