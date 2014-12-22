"use strict";

var Section = function (prevSection, nextSection) {

    if (prevSection instanceof Point) {
        this.begin = prevSection
    } else if(prevSection instanceof Section) {
        this.begin = prevSection.end;
        this.prev = prevSection;
        prevSection.next = this;
    }

    if (nextSection instanceof Point) {
        this.end = nextSection
    } else if(nextSection instanceof Section) {
        this.end = nextSection.begin;
        this.next = nextSection;
        nextSection.prev = this;
    }
    var dx = this.end.x - this.begin.x;
    var dy = this.end.y - this.begin.y;
    this.length = Math.sqrt(dx*dx+dy*dy);
    this.ax = dx/this.length;
    this.ay = dy/this.length;

    this.Prev = function(num){
        var section = this;
        while(num--) {
            section = section.prev;
        }
        return section;
    };
    this.Next = function(num){
        var section = this;
        while(num--) {
            section = section.next;
        }
        return section;
    };
    DrawSection(this);
};

var Switch = function(inSection, outSection, sideSection, direct) {
    this.in = inSection;
    this.out = outSection;
    this.side = sideSection;
    this.direct = direct ? direct : 1;
    var _side = false;
    var that = this;

    var link = (this.direct > 0) ? 'prev' : 'next';
    this.out[link] = this.in;
    this.side[link] = this.in;

    function applyState() {
        var link = (that.direct > 0) ? 'next' : 'prev';
        if (_side) {
            that.in[link] = that.side;
        } else {
            that.in[link] = that.out;
        }
    }

    this.toStraight = function(){
        _side = false;
        applyState();
    };
    this.toSide = function(){
        _side = true;
        applyState();
    };
    this.toggle = function(){
        _side = !_side;
        applyState();
    };
    this.getState = function(){
        return _side;
    };

    this.toStraight();
};

var Train = function(position, speed, color) {
    var that = this;
    var _detectPosition = function() {
        var beginX = that.currentSection.begin.x;
        var beginY = that.currentSection.begin.y;
        that.coords.x = beginX + that.currentPosition * that.currentSection.ax;
        that.coords.y = beginY + that.currentPosition * that.currentSection.ay;
    };
    if (position instanceof Section) {
        this.coords = new Point(position.begin.x, position.begin.y, false);
        this.currentSection = position;
        this.currentPosition = 0;
        this.speed = speed ? speed : 4;
        this.visual = new VisualTrain(this, color);
        this.visual.redraw();
        this.update = function(time) {
            if (this.speed > 0) {
                this.currentPosition += time * this.speed;
                if (this.currentPosition > this.currentSection.length) {
                    if (this.currentSection.next instanceof Section) {
                        this.currentPosition -= this.currentSection.length;
                        this.currentSection = this.currentSection.next;
                    } else {
                        alert('Конец пути достигнут');
                        this.speed = 0;
                    }
                }
                _detectPosition();
                this.visual.redraw();
            }
        };
        updatedObjects.push(this);
    }
};

var Point = function (x, y, draw) {
    this.x = x;
    this.y = y;
    if (draw !== false) {
        DrawPoint(this);
    }
};

var updatedObjects = [];

var switchLastNumber = 0;
var switchList = [];

function load() {

    var pathA = circularPath(createCircleCoords(180, 2));
    var pathB = circularPath(createCircleCoords(170, 2));
    var pathC = circularPath(createCircleCoords(160, 2));
    var pathD = circularPath(createCircleCoords(150, 2));


    makeCross(pathD.begin.Prev(2), pathC.begin);
    makeCross(pathC.begin, pathD.begin.Next(2));

    makeCross(pathC.begin.Next(1), pathB.begin.Next(3));
    makeCross(pathB.begin.Next(4), pathC.begin.Next(6));

    makeCross(pathB.begin.Next(0), pathA.begin.Next(2));
    makeCross(pathA.begin.Next(2), pathB.begin.Next(4));

    /*var additionSection = new Section(pathA.begin.end, pathB.sections[1].end);
     var S1 = new Switch(pathA.begin, pathA.begin.next, additionSection, 1);
     var S2 = new Switch(pathB.sections[2], pathB.sections[1], additionSection, -1);
     new SwitchController(S1, $('#S1'));
     new SwitchController(S2, $('#S2'));

     var twoToOneSection = new Section(pathB.begin.prev.prev.prev.end, pathA.begin.prev.begin);
     var S3 = new Switch(pathB.begin.prev.prev.prev, pathB.begin.prev.prev, twoToOneSection, 1);
     var S4 = new Switch(pathA.begin.prev, pathA.begin.prev.prev, twoToOneSection, -1);
     new SwitchController(S3, $('#S3'));
     new SwitchController(S4, $('#S4'));*/

    new Train(pathA.begin, 100, '#0c0');
    new Train(pathB.begin, 180, '#c80');
    new Train(pathC.begin, 150, '#cc0');
    new Train(pathD.begin, 140, '#00f');


    var pathE = circularPath(createCircleCoords(20, 10));
    var pathF = circularPath(createCircleCoords(30, 10));
    makeCross(pathE.begin.Prev(3), pathF.begin.Next(2));
    makeCross(pathF.begin.Next(2), pathE.begin.Next(7));
    new Train(pathE.begin, 60, '#f00');

    loop(20);
}

function createAutoSwitch(inSection, outSection, sideSection, direct) {
    var thisSwitch = new Switch(inSection, outSection, sideSection, direct);
    switchList[++switchLastNumber] = thisSwitch;
    new SwitchController(thisSwitch, switchLastNumber);
}

function makeCross(beginPathA, endPathB) {
    var crossSection = new Section(beginPathA.end, endPathB.begin);
    createAutoSwitch(beginPathA, beginPathA.next, crossSection, 1);
    createAutoSwitch(endPathB, endPathB.prev, crossSection, -1);
}

function createCircleCoords(radius, inFixed) {
    var fixed = inFixed > 0 ? inFixed : 30;
    var coordinates = [], angle, multiplier = Math.PI/180, angleRadian, x, y;
    for (angle = 0; angle < 360; angle += fixed) {
        angleRadian = multiplier * angle;
        x = Math.cos(angleRadian) * radius;
        y = Math.sin(angleRadian) * radius;
        x += Math.random() * 1;
        y += Math.random() * 1;
        coordinates.push([x, y]);
    }
    return coordinates;
}

function loop(msec) {
    var lastTime = Date.now();
    setInterval(function(){
        var currentTime = Date.now();
        var delta = (currentTime - lastTime)/1000;
        updatedObjects.map(function(item){
            item.update(delta);
        });
        lastTime = currentTime;
    }, msec);
}

function createPath(coords) {
    var sections = [], i=0;
    var prev = new Section(new Point(coords[i][0], coords[i][1]), new Point(coords[i+1][0], coords[i+1][1]));
    sections.push(prev);
    i+=2;
    while(coords[i]) {
        prev = new Section(prev, new Point(coords[i][0], coords[i][1]));
        sections.push(prev);
        ++i;
    }
    return {
        begin: sections[0],
        end: sections[sections.length-1],
        sections: sections
    };
}

function circularPath(coords) {
    var path = createPath(coords);
    path.sections.push(new Section(path.end, path.begin));
    return path;
}