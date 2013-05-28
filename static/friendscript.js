$(function() {
    
    doUpdate();
    doSetup();

});

var playerheights = Array(0, 80, 80, 200);
var playerwidths = Array(0, 250, 290, 290);
var NUMSONGS = 10;

// ********************************

function doUpdate() {
    
    }


function doSetup() {

    window.fbAsyncInit = function() {
        FB.Canvas.setAutoGrow();
        };

    $("#buttonbar").find("button").button();

    $('#edit').on("click", function() {
        window.location = "/make_songs/" + facebook_id + '/False';        
        });
        
    $('#home').on("click", function() {
        window.location = "/show_songs/" + user_id;        
        });

    $('#jukebox').on("click", function() {
        window.location = "/jukebox/" + user_id;        
        });
     
    $(".friend").mouseenter(function() {
        $(this).addClass("ui-state-hover");
        }).mouseleave(function() {
            $(this).removeClass("ui-state-hover");
            });
            
    $(".friend").click(function() {
        $(this).addClass("ui-state-focus");
        window.location = "/show_songs/" + $(this).next("input").val();
        });
}

// **************************************************************
function panelNumber(id) {
    return parseInt(id.slice(0, id.indexOf("tabs")));    
    }
