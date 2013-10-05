/// <reference path="../reference.ts"/>

class StorageService {    
    get(key:string): any {
        return JSON.parse(localStorage.getItem(key) || "null") || undefined;
    }

    set(key:string,value: any): void {
        localStorage.setItem(key, JSON.stringify(value));        
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }    
}

myApp.services.service('storageService', StorageService);