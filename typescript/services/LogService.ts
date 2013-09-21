/// <reference path="../reference.ts"/>
class LogService{
    log(msg:string){
        console.log(msg);
    }
}
myApp.services.service('logService',LogService);