var myApp;
(function (myApp) {
    myApp.services = angular.module('myApp.services', []);
    myApp.directives = angular.module('myApp.directives', []);
})(myApp || (myApp = {}));
var ToolType;
(function (ToolType) {
    ToolType.brush = "brush";
    ToolType.rectangle = "rectangle";
})(ToolType || (ToolType = {}));

var annotationsModule;
(function (annotationsModule) {
    annotationsModule.annotationSetting = {
        color: 'white',
        shadow: '#000000',
        lineWidth: 4,
        circleRadius: 15,
        circleColor: '#00b8f1',
        circleBorderColor: '#FFFFFF',
        circleBorderRadius: 3,
        circleFontFamily: 'Arial Bold',
        circleFontSize: 20,
        circleFontYDisplacement: 12,
        circleFontColor: 'white'
    };

    function createJSPoint_to_pixel(point) {
        var x = (point.x);
        var y = (point.y);
        return {
            x: x,
            y: y
        };
    }
    annotationsModule.createJSPoint_to_pixel = createJSPoint_to_pixel;

    function pixel_to_createJSPoint(point) {
        var x = (point.x);
        var y = (point.y);
        return new createjs.Point(x, y);
    }
    annotationsModule.pixel_to_createJSPoint = pixel_to_createJSPoint;
})(annotationsModule || (annotationsModule = {}));
var RectangleTool = (function () {
    function RectangleTool(drawingCanvas, liveDrawingCanvas) {
        this.drawingCanvas = drawingCanvas;
        this.liveDrawingCanvas = liveDrawingCanvas;
    }
    RectangleTool.prototype.renderDrawing = function (drawing) {
        if (!drawing.rectangle)
            return;

        this.drawingCanvas.drawRect(drawing.rectangle.x, drawing.rectangle.y, drawing.rectangle.width, drawing.rectangle.height);
    };

    RectangleTool.prototype.handleMouseDown = function (pixelx, pixely) {
        this.startPoint = new createjs.Point(pixelx, pixely);
        this.endPoint = null;
    };

    RectangleTool.prototype.handleMouseMove = function (pixelx, pixely) {
        this.endPoint = new createjs.Point(pixelx, pixely);

        this.liveDrawingCanvas.beginStroke(annotationsModule.annotationSetting.color);
        this.liveDrawingCanvas.drawRect(this.startPoint.x, this.startPoint.y, this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
        this.liveDrawingCanvas.endStroke();
    };

    RectangleTool.prototype.handleMouseUp = function () {
        if (!this.endPoint) {
            return null;
        }

        var xMin = Math.min(this.startPoint.x, this.endPoint.x);
        var xMax = Math.max(this.startPoint.x, this.endPoint.x);

        var yMin = Math.min(this.startPoint.y, this.endPoint.y);
        var yMax = Math.max(this.startPoint.y, this.endPoint.y);

        var currentPointAnnotation = {
            type: ToolType.rectangle,
            numberLocation: { x: xMin, y: yMin },
            rectangle: { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin }
        };

        return currentPointAnnotation;
    };
    return RectangleTool;
})();
var BrushTool = (function () {
    function BrushTool(drawingCanvas, liveDrawingCanvas) {
        this.drawingCanvas = drawingCanvas;
        this.liveDrawingCanvas = liveDrawingCanvas;
    }
    BrushTool.prototype.renderDrawing = function (drawing) {
        var _this = this;
        if (drawing.points.length == 0)
            return;

        var oldPt = annotationsModule.pixel_to_createJSPoint(drawing.points[0]);
        var oldMidPt = oldPt.clone();

        _.forEach(drawing.points, function (pixelPoint) {
            var newPoint = annotationsModule.pixel_to_createJSPoint(pixelPoint);
            var midPt = new createjs.Point((oldPt.x + newPoint.x) / 2, (oldPt.y + newPoint.y) / 2);

            _this.drawingCanvas.moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

            oldPt = newPoint.clone();
            oldMidPt = midPt.clone();
        });
    };

    BrushTool.prototype.handleMouseDown = function (pixelx, pixely) {
        this.oldPt = new createjs.Point(pixelx, pixely);
        this.oldMidPt = this.oldPt;

        this.currentPointAnnotation = {
            type: ToolType.brush,
            numberLocation: null,
            points: [annotationsModule.createJSPoint_to_pixel(this.oldPt)]
        };

        this.liveDrawingCanvas.beginStroke(annotationsModule.annotationSetting.color);
    };

    BrushTool.prototype.handleMouseMove = function (pixelx, pixely) {
        var newPoint = new createjs.Point(pixelx, pixely);
        var midPt = new createjs.Point((this.oldPt.x + newPoint.x) / 2, (this.oldPt.y + newPoint.y) / 2);

        this.liveDrawingCanvas.moveTo(midPt.x, midPt.y).curveTo(this.oldPt.x, this.oldPt.y, this.oldMidPt.x, this.oldMidPt.y);

        this.oldPt = newPoint.clone();

        this.oldMidPt.x = midPt.x;
        this.oldMidPt.y = midPt.y;

        var pixelpoint = annotationsModule.createJSPoint_to_pixel(this.oldPt);
        this.currentPointAnnotation.points.push(pixelpoint);
    };

    BrushTool.prototype.handleMouseUp = function () {
        var minx = _.min(this.currentPointAnnotation.points, function (point) {
            return point.x;
        }).x;
        var miny = _.min(this.currentPointAnnotation.points, function (point) {
            return point.y;
        }).y;
        this.currentPointAnnotation.numberLocation = new createjs.Point(minx, miny);

        return this.currentPointAnnotation;
    };
    return BrushTool;
})();
function bindProtoFunctions(thisObj) {
    var args = [thisObj];
    var protos = thisObj.constructor.prototype;
    for (var attr in protos) {
        if (_.isFunction(protos[attr])) {
            args.push(attr);
        }
    }
    _.bindAll.apply(_, args);
}

var AnnotationDisplayManager = (function () {
    function AnnotationDisplayManager(canvas) {
        this.canvas = canvas;
        this.canvaswidth = 1;
        this.canvasheight = 1;
        bindProtoFunctions(this);

        this.stage = new createjs.Stage(canvas);
        createjs.Touch.enable(this.stage);

        this.drawingCanvasShadow = new createjs.Shadow(annotationsModule.annotationSetting.shadow, 5, 5, 15);

        var drawingCanvas = new createjs.Shape();
        var liveDrawingCanvas = new createjs.Shape();

        drawingCanvas.shadow = this.drawingCanvasShadow;
        liveDrawingCanvas.shadow = this.drawingCanvasShadow;

        this.stage.addChild(drawingCanvas);
        this.stage.addChild(liveDrawingCanvas);

        this.drawingCanvas = drawingCanvas.graphics;
        this.liveDrawingCanvas = liveDrawingCanvas.graphics;

        this.annotationNumberLayer = new createjs.Container();
        this.stage.addChild(this.annotationNumberLayer);

        this.stage.autoClear = true;
        this.stage.enableDOMEvents(true);

        this.stage.addEventListener("stagemousedown", this.handleMouseDown);

        this.queue = new createjs.LoadQueue(false);

        this.brushTool = new BrushTool(this.drawingCanvas, this.liveDrawingCanvas);
        this.rectangleTool = new RectangleTool(this.drawingCanvas, this.liveDrawingCanvas);

        this.setTool(ToolType.brush);
    }
    AnnotationDisplayManager.prototype.renderAnnotationNumber = function (annotationNumber, drawing) {
        var circleRadius = annotationsModule.annotationSetting.circleRadius / this.currentZoom;
        var circleBorderRadius = circleRadius + annotationsModule.annotationSetting.circleBorderRadius / this.currentZoom;
        var fontSize = (annotationsModule.annotationSetting.circleFontSize / this.currentZoom);
        var fontYDisplacement = (annotationsModule.annotationSetting.circleFontYDisplacement) / this.currentZoom;
        var fontString = fontSize + 'px ' + annotationsModule.annotationSetting.circleFontFamily;

        var circleShape = new createjs.Shape();
        var g = circleShape.graphics;
        g.beginFill(annotationsModule.annotationSetting.circleBorderColor);
        g.drawCircle(drawing.numberLocation.x, drawing.numberLocation.y, circleBorderRadius);
        g.endFill();
        g.beginFill(annotationsModule.annotationSetting.circleColor);
        g.drawCircle(drawing.numberLocation.x, drawing.numberLocation.y, circleRadius);
        g.endFill();
        this.annotationNumberLayer.addChild(circleShape);

        var numberShape = new createjs.Text(annotationNumber.toString(), fontString, annotationsModule.annotationSetting.circleFontColor);
        numberShape.x = drawing.numberLocation.x;
        numberShape.y = drawing.numberLocation.y - fontYDisplacement;
        numberShape.textAlign = 'center';
        this.annotationNumberLayer.addChild(numberShape);
    };

    AnnotationDisplayManager.prototype.renderDrawing = function (annotationNumber, drawing) {
        this.renderAnnotationNumber(annotationNumber, drawing);

        switch (drawing.type) {
            case ToolType.brush:
                this.brushTool.renderDrawing(drawing);
                break;
            case ToolType.rectangle:
                this.rectangleTool.renderDrawing(drawing);
        }
    };

    AnnotationDisplayManager.prototype.resetDrawingCanvas = function () {
        this.drawingCanvas.clear().setStrokeStyle(annotationsModule.annotationSetting.lineWidth / this.currentZoom, 'round', 'round');
        this.resetLiveDrawingCanvas();
    };

    AnnotationDisplayManager.prototype.resetLiveDrawingCanvas = function () {
        this.liveDrawingCanvas.clear().setStrokeStyle(annotationsModule.annotationSetting.lineWidth / this.currentZoom, 'round', 'round');
    };

    AnnotationDisplayManager.prototype.initialzeUnsavedAnnotations = function () {
        this.imageModel.unsavedAnnotation = { index: this.imageModel.annotations.length + 1, drawings: [] };
    };

    AnnotationDisplayManager.prototype.redraw = function () {
        var _this = this;
        if (!this.imageModel)
            return;

        this.resetDrawingCanvas();
        this.annotationNumberLayer.removeAllChildren();

        this.drawingCanvas.beginStroke(annotationsModule.annotationSetting.color);

        _.forEach(this.imageModel.annotations, function (annotation) {
            _.forEach(annotation.drawings, function (drawing) {
                _this.renderDrawing(annotation.index, drawing);
            });
        });

        _.forEach(this.imageModel.unsavedAnnotation.drawings, function (drawing) {
            _this.renderDrawing(_this.imageModel.unsavedAnnotation.index, drawing);
        });

        this.drawingCanvas.endStroke();

        this.stage.update();
    };

    AnnotationDisplayManager.prototype.resize = function (width, height) {
        if (!width || !height)
            return;
        this.canvaswidth = width;
        this.canvasheight = height;

        this.stage.canvas.width = width;
        this.stage.canvas.height = height;

        var widthZoom = width / this.imageModel.width;
        var heightZoom = height / this.imageModel.height;
        this.minZoom = Math.min(widthZoom, heightZoom);
        this.currentZoom = this.minZoom;

        this.stage.scaleX = this.currentZoom;
        this.stage.scaleY = this.currentZoom;

        this.redraw();
    };

    AnnotationDisplayManager.prototype.setImageModel = function (imageModel) {
        var _this = this;
        if (!imageModel)
            return;
        this.imageModel = imageModel;

        this.initialzeUnsavedAnnotations();

        var onComplete = function () {
            if (_this.image)
                _this.stage.removeChildAt(0);

            _this.image = new createjs.Bitmap(_this.queue.getResult("myImage"));
            _this.stage.addChildAt(_this.image, 0);
            _this.stage.update();

            _this.resize(_this.canvaswidth, _this.canvasheight);
        };

        this.queue.addEventListener("complete", onComplete);
        this.queue.loadManifest([
            { id: "myImage", src: imageModel.uri }
        ]);
    };

    AnnotationDisplayManager.prototype.setTool = function (tool) {
        this.activeTool = tool;
    };

    AnnotationDisplayManager.prototype.isMouseOutsideImage = function () {
        return !this.image.hitTest(this.stage.mouseX / this.stage.scaleX, this.stage.mouseY / this.stage.scaleY);
    };

    AnnotationDisplayManager.prototype.handleMouseDown = function (event) {
        if (this.isMouseOutsideImage()) {
            return;
        }

        var pixelx = this.stage.mouseX / this.stage.scaleX;
        var pixely = this.stage.mouseY / this.stage.scaleY;

        this.stage.addEventListener("stagemousemove", this.handleMouseMove);
        this.stage.addEventListener("stagemouseup", this.handleMouseUp);

        switch (this.activeTool) {
            case ToolType.brush:
                this.brushTool.handleMouseDown(pixelx, pixely);
                break;
            case ToolType.rectangle:
                this.rectangleTool.handleMouseDown(pixelx, pixely);
                break;
        }

        this.stage.update();
    };

    AnnotationDisplayManager.prototype.handleMouseMove = function (event) {
        if (this.isMouseOutsideImage()) {
            return;
        }

        var pixelx = this.stage.mouseX / this.stage.scaleX;
        var pixely = this.stage.mouseY / this.stage.scaleY;

        switch (this.activeTool) {
            case ToolType.brush:
                this.brushTool.handleMouseMove(pixelx, pixely);
                break;
            case ToolType.rectangle:
                this.resetLiveDrawingCanvas();
                this.rectangleTool.handleMouseMove(pixelx, pixely);
                break;
        }

        this.stage.update();
    };

    AnnotationDisplayManager.prototype.handleMouseUp = function (event) {
        this.stage.removeEventListener("stagemousemove", this.handleMouseMove);
        this.stage.removeEventListener("stagemouseup", this.handleMouseUp);

        var currentAnnotation;

        switch (this.activeTool) {
            case ToolType.brush:
                currentAnnotation = this.brushTool.handleMouseUp();
                break;
            case ToolType.rectangle:
                currentAnnotation = this.rectangleTool.handleMouseUp();
                break;
        }

        if (currentAnnotation) {
            if (!this.imageModel.unsavedAnnotation)
                this.initialzeUnsavedAnnotations();

            this.imageModel.unsavedAnnotation.drawings.push(currentAnnotation);
        }

        this.redraw();
    };
    return AnnotationDisplayManager;
})();
var annotateimage;
(function (annotateimage) {
    annotateimage.html = '<canvas> </canvas>';
})(annotateimage || (annotateimage = {}));
var Controllers;
(function (Controllers) {
    var MainController = (function () {
        function MainController($scope) {
            this.image1 = {
                uri: './images/landscape.jpg',
                width: 1920,
                height: 1200,
                annotations: []
            };
            this.image2 = {
                uri: './images/spacesloth.jpg',
                width: 552,
                height: 704,
                annotations: []
            };
            this.tool = 'brush';
            $scope.vm = this;
            this.currentImage = this.image1;
        }
        MainController.prototype.save = function () {
            if (this.image1.unsavedAnnotation && this.image1.unsavedAnnotation.drawings.length) {
                this.image1.annotations.push(this.image1.unsavedAnnotation);
                this.image1.unsavedAnnotation = null;
            }
            if (this.image2.unsavedAnnotation && this.image2.unsavedAnnotation.drawings.length) {
                this.image2.annotations.push(this.image2.unsavedAnnotation);
                this.image2.unsavedAnnotation = null;
            }
        };

        MainController.prototype.settool = function (tool) {
            this.tool = tool;
        };
        return MainController;
    })();
    Controllers.MainController = MainController;
})(Controllers || (Controllers = {}));
var BaseLayer = (function () {
    function BaseLayer() {
    }
    return BaseLayer;
})();
myApp.directives.directive('annotateimage', [
    '$isolator',
    function ($isolator) {
        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                scope = $isolator.setupDirective({
                    image: '=',
                    width: '=',
                    height: '=',
                    tool: '='
                }, scope, element, attrs, annotateimage.html);

                var canvas = element.find('canvas')[0];

                var manager = new AnnotationDisplayManager(canvas);

                scope.$watch('image', function () {
                    manager.setImageModel(scope.image);
                });

                scope.$watch('tool', function () {
                    manager.setTool(scope.tool);
                });

                scope.$watch('width', function () {
                    manager.resize(scope.width, scope.height);
                });
                scope.$watch('height', function () {
                    manager.resize(scope.width, scope.height);
                });
            }
        };
    }
]);
myApp.directives.directive('loadSize', [
    '$parse',
    function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var loadTheSize = _.debounce(function () {
                    scope.$apply(function () {
                        var width = element.width();
                        var height = element.height();
                        $parse(attrs.loadSizeWidth).assign(scope, width);
                        $parse(attrs.loadSizeHeight).assign(scope, height);
                    });
                }, 100);

                $(window).resize(loadTheSize);

                loadTheSize();
            }
        };
    }
]);
myApp.directives.directive('ratio', function ($parse) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            var preserveRatio = function () {
                var ratio = $parse((attrs).ratio)(scope);
                var width = element.width();
                var height = ratio * width;
                element.css('height', height + 'px');
                $parse(attrs.calculatedheight).assign(scope, height);
                $parse(attrs.calculatedwidth).assign(scope, width);
            };

            scope.$watch(attrs.ratio, function (val) {
                if (val)
                    preserveRatio();
            });

            var debouncedPreserveRatio = _.debounce(function () {
                scope.$apply(function () {
                    preserveRatio();
                });
            }, 100);

            $(window).resize(debouncedPreserveRatio);
        }
    };
});
var $isolatorService = (function () {
    function $isolatorService($interpolate, $parse, $compile) {
        this.$interpolate = $interpolate;
        this.$parse = $parse;
        this.$compile = $compile;
    }
    $isolatorService.prototype.setupDirective = function (scopeDefinition, scope, element, attrs, template) {
        scope = scope.$new(true);

        var $interpolate = this.$interpolate;
        var $parse = this.$parse;

        var NON_ASSIGNABLE_MODEL_EXPRESSION = 'Non-assignable model expression: ';

        var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/;

        var parentScope = scope.$parent || scope;

        angular.forEach(scopeDefinition, function (definiton, scopeName) {
            var match = definiton.match(LOCAL_REGEXP) || [], attrName = match[3] || scopeName, optional = (match[2] == '?'), mode = match[1], lastValue, parentGet, parentSet;

            scope.$$isolateBindings[scopeName] = mode + attrName;

            switch (mode) {
                case '@': {
                    attrs.$observe(attrName, function (value) {
                        scope[scopeName] = value;
                    });
                    attrs.$$observers[attrName].$$scope = parentScope;
                    if (attrs[attrName]) {
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
                        lastValue = scope[scopeName] = parentGet(parentScope);
                        throw Error(NON_ASSIGNABLE_MODEL_EXPRESSION + attrs[attrName]);
                    };
                    lastValue = scope[scopeName] = parentGet(parentScope);
                    scope.$watch(function parentValueWatch() {
                        var parentValue = parentGet(parentScope);

                        if (parentValue !== scope[scopeName]) {
                            if (parentValue !== lastValue) {
                                lastValue = scope[scopeName] = parentValue;
                            } else {
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

        if (angular.isDefined(template)) {
            var newelement = this.$compile(template)(scope);
            element.append(newelement);
        }
        return scope;
    };
    $isolatorService.$inject = ['$interpolate', '$parse', '$compile'];
    return $isolatorService;
})();

angular.module('ka', []).service('$isolator', $isolatorService);
var LogService = (function () {
    function LogService() {
    }
    LogService.prototype.log = function (msg) {
        console.log(msg);
    };
    return LogService;
})();
myApp.services.service('logService', LogService);
var StorageService = (function () {
    function StorageService() {
    }
    StorageService.prototype.get = function (key) {
        return JSON.parse(localStorage.getItem(key) || "null") || undefined;
    };

    StorageService.prototype.set = function (key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    StorageService.prototype.removeItem = function (key) {
        localStorage.removeItem(key);
    };
    return StorageService;
})();

myApp.services.service('storageService', StorageService);
angular.module('myApp', ['myApp.directives', 'myApp.services', 'ka']).controller(Controllers);
//# sourceMappingURL=out.js.map
