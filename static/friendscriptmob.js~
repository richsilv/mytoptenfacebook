$(function() {
    
    doUpdate();
    doSetup();

});

var playerheights = Array(0, 80, 80, 200);
var playerwidths = Array(0, 250, 290, 290);
var NUMSONGS = 3;

// ********************************

function doUpdate() {
    
    }


function doSetup() {

/*-    $('#edit').on("click", function() {
        window.location = "/make_songs_mob/" + facebook_id + '/False';        
        });  -*/
        
    $('#home').on("click", function() {
        window.location = "/show_songs_mob/" + user_id;        
        });
            
    $(".friend").click(function() {
        window.location = "/show_songs_mob/" + $(this).next("input").val();
        });
}

// **************************************************************
function panelNumber(id) {
    return parseInt(id.slice(0, id.indexOf("tabs")));    
    }
