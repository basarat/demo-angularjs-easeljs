/// <reference path="../reference.ts"/>
class LogService{
    log(msg:any){
        console.log(msg);
    }
}
myApp.services.service('logService',LogService);