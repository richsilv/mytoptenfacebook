// Functions to reveal either the saved title/artist or the title/artist entry boxes

function toggleTitleArtist(header) {
    if (header.children('.songentry').css("display")==="none") {
        hideTitleArtist(header);        
        }
    else {
        showTitleArtist(header);
        }
    }
    
function showTitleArtist(header) {
    header.children('.songentry').css("display", "none");
    header.children('.songtitleartist').css("display", "inline-block");
    $('#confirm').focus();
    }
 
function hideTitleArtist(header) {
    header.children('.songtitleartist').css("display", "none");
    header.children('.songentry').css("display", "inline-block");
    header.children('.songentry').find('.titleentry').focus();
    }

// Set icon size based on page width (inferred from CSS)
if ($("body").css("width") === "620px") {
    var iconSize = "big";
    }
else {
    var iconSize = "small";        
    }
