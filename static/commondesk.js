// Rewrite the keydown function within the accordion to allow spaces
$.ui.accordion.prototype._keydown = function( event ) {
        if ( event.altKey || event.ctrlKey ) {
            return;
        }

        var keyCode = $.ui.keyCode,
            length = this.headers.length,
            currentIndex = this.headers.index( event.target ),
            toFocus = false;

        switch ( event.keyCode ) {
            case keyCode.DOWN:
                toFocus = this.headers[ ( currentIndex + 1 ) % length ];
                break;
            case keyCode.UP:
                toFocus = this.headers[ ( currentIndex - 1 + length ) % length ];
                break;
            case keyCode.ENTER:
                this._eventHandler( event );
                break;
            case keyCode.HOME:
                toFocus = this.headers[ 0 ];
                break;
            case keyCode.END:
                toFocus = this.headers[ length - 1 ];
                break;
        }

        if ( toFocus ) {
            $( event.target ).attr( "tabIndex", -1 );
            $( toFocus ).attr( "tabIndex", 0 );
            toFocus.focus();
            event.preventDefault();
        }
    }

// Return the new order of headers in the accordion after reordering
function newOrder() {
    var pans = $(".panel")
    var indices = $.map(pans, function(element) { return panelNumber(element.getAttribute('id'))-1; });
    return indices
    }

// Rearrange the song details array be the new ordering
function newDeets(order) {
    var newdeets = new Array();
    $.each(order, function(index, value) {
        newdeets.push(songdeets[value]);
        });
    return newdeets    
    }

// Rename the panels in the accordion subject to the new order
function renamePanels(order) {
    divs = $(".header:not(.newsong)").parent(".acccont");
    for (i=1; i<num_songs+1; i++) {
        divs.eq(i-1).attr("id", "ac"+i)
        divs.eq(i-1).children(".header").attr("id", i+"header").attr("aria-controls", i+"panel")
        divs.eq(i-1).children(".panel").attr("id", i+"panel").attr("aria-labelledby", i+"header")
        }
    }

// Functions to reveal either the saved title/artist or the title/artist entry boxes
function toggleTitleArtist(header) {
    header.children('.songtitleartist').toggle("slide", function() {
        $(this).siblings('.songentry').toggle("slide");
        });
    }
    
function showTitleArtist(header) {
    header.children('.songentry').hide("slide", function() {
        $(this).siblings('.songtitleartist').show("slide");
        });
    }
 
function hideTitleArtist(header) {
    header.children('.songtitleartist').hide("slide", function() {
        $(this).siblings('.songentry').show("slide");
        });
    }
