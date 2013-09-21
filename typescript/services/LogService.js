/// <reference path="../reference.ts"/>
var LogService = (function () {
    function LogService() {
    }
    LogService.prototype.log = function (msg) {
        console.log(msg);
    };
    return LogService;
})();
myApp.services.service('logService', LogService);
//# sourceMappingURL=LogService.js.map
