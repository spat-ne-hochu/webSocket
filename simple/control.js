"use strict";

/**
 *
 * @param {Switch} switchObj
 * @param number
 * @constructor
 */
function SwitchController(switchObj, number) {

    $('#ctrl').append('<button class="switch" id="S'+number+'">S'+number+'</div>');

    var button = $('#S'+number);

    button.click(function(){
        switchObj.toggle();
        syncState();
    });

    syncState();

    function syncState(){
        var state = switchObj.getState();
        if (state) {
            button.css({background: '#f80'});
        } else {
            button.css({background: ''});
        }
    }
}
