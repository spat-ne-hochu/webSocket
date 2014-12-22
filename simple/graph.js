"use strict";
var MIN_ZOOM = -32;
var MAX_ZOOM = 20;

var $scene, $svg;
var dx = Math.floor($(window).width()/2);
var dy = Math.floor($(window).height()/2);
var zoom = 1;

$(function() {
    var $area = $('#area');
    $area.svg();
    $svg = $area.svg('get');
    $scene = $svg.group({transform: 'translate(0, 0)'});

    $area[0].addEventListener ("wheel", function(event) {
        zoom += Math.abs(event.wheelDeltaY)/event.wheelDeltaY;
        if (zoom < MIN_ZOOM) zoom = MIN_ZOOM;
        if (zoom > MAX_ZOOM) zoom = MAX_ZOOM;
        updateView();
    }, false);

    var _dx = 0;
    var _dy = 0;

    function move(evt) {
        dx = _dx + evt.clientX;
        dy = _dy + evt.clientY;
        updateView();
    }

    $area.mousedown(function(evt) {
        _dx = dx - evt.clientX;
        _dy = dy - evt.clientY;
        $area.mousemove(move);
    });

    $area.mouseup(function() {
        $area.unbind('mousemove');
    });

    load();
    updateView();
});

function updateView() {
    var realZoom = Math.pow(2, zoom/2);
    $scene.transform.baseVal[0].matrix.a = realZoom;
    $scene.transform.baseVal[0].matrix.d = realZoom;
    $scene.transform.baseVal[0].matrix.e = dx;
    $scene.transform.baseVal[0].matrix.f = dy;
    //$scene.attr('transform', 'translate('+dx+', '+dy+'), scale('+zoom+')');
}

function DrawPoint(point) {
    if (point instanceof Point) {
        $svg.circle($scene, point.x, point.y, 1,
            {fill: '#444', stroke: '#fff', strokeWidth: 0});
    }
}

function DrawSection(section) {
    if (section instanceof Section) {
        $svg.line($scene, section.begin.x, section.begin.y, section.end.x, section.end.y,
            {stroke: '#444', strokeWidth: 2});
    }
}

function VisualTrain(trainObj, color) {
    var lastPoint = null;
    this.redraw = function() {
        if (lastPoint !== null) {
            lastPoint.remove();
            lastPoint = null;
        }
        lastPoint = $svg.circle($scene, trainObj.coords.x, trainObj.coords.y, 2,
            {
                fill: 'transparent',
                stroke: color ? color : '#c00',
                strokeWidth: 2
            });
    }
}
