/// <reference path="../reference.ts" />

class $isolatorService {

    static $inject = ['$interpolate', '$parse', '$compile'];
    constructor(public $interpolate: ng.IInterpolateService, public $parse: ng.IParseService, public $compile: ng.ICompileService) { }

    // Returns the new scope 
    setupDirective(scopeDefinition, scope: ng.IScope, element:JQuery, attrs, template?: string) :any {

        // Create an isolate scope : 
        scope = scope.$new(true);

        // To make it easier to upgrade this code        
        var $interpolate = this.$interpolate;
        var $parse = this.$parse;

        // NG constants: 
        var NON_ASSIGNABLE_MODEL_EXPRESSION = 'Non-assignable model expression: ';

        //////////////////////// Code copied from Compile.js: 

        var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/;

        var parentScope = scope.$parent || scope;

        angular.forEach(scopeDefinition, function (definiton, scopeName) {
            var match = definiton.match(LOCAL_REGEXP) || [],
                attrName = match[3] || scopeName,
                optional = (match[2] == '?'),
                mode = match[1], // @, =, or &
                lastValue,
                parentGet, parentSet;

            scope.$$isolateBindings[scopeName] = mode + attrName;

            switch (mode) {

                case '@': {
                    attrs.$observe(attrName, function (value) {
                        scope[scopeName] = value;
                    });
                    attrs.$$observers[attrName].$$scope = parentScope;
                    if (attrs[attrName]) {
                        // If the attribute has been provided then we trigger an interpolation to ensure the value is there for use in the link fn
                        scope[scopeName] = $interpolate(attrs[attrName])(parentScope);
                    }
                    break;
                }

                case '=': {
                    if (optional && !attrs[attrName]) {
                        return;
                    }
                    parentGet = $parse(attrs[attrName]);
                    parentSet = parentGet.assign || function () {
                        // reset the change, or we will throw this exception on every $digest
                        lastValue = scope[scopeName] = parentGet(parentScope);
                        throw Error(NON_ASSIGNABLE_MODEL_EXPRESSION + attrs[attrName]);
                    };
                    lastValue = scope[scopeName] = parentGet(parentScope);
                    scope.$watch(function parentValueWatch() {
                        var parentValue = parentGet(parentScope);

                        if (parentValue !== scope[scopeName]) {
                            // we are out of sync and need to copy
                            if (parentValue !== lastValue) {
                                // parent changed and it has precedence
                                lastValue = scope[scopeName] = parentValue;
                            } else {
                                // if the parent can be assigned then do so
                                parentSet(parentScope, parentValue = lastValue = scope[scopeName]);
                            }
                        }
                        return parentValue;
                    });
                    break;
                }

                case '&': {
                    parentGet = $parse(attrs[attrName]);
                    scope[scopeName] = function (locals) {
                        return parentGet(parentScope, locals);
                    };
                    break;
                }

                default: {
                    throw Error('Invalid isolate scope definition for directive ' + definiton);
                }
            }
        });

        ////////////////////////END OF Code copied from Compile.js: 

        // If template was passed compile with this scope. 
        if (angular.isDefined(template)) {
            var newelement = this.$compile(template)(scope);
            element.append(newelement);
        }
        return scope;
    }
}
// Setup the service 
angular.module('ka', []).service('$isolator', $isolatorService);
