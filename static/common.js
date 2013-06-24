// Setup various constants
var playerheights = Array(0, 80, 80, 200, 200, 80, 183);
var playerwidths = Array(0, 250, 290, 290, 290, 290);
var playerHeightsSmall = Array(0, 80, 80, 200, 200, 27);
var playerWidthsSmall = Array(0, 290, 290, 290, 290, 290);
var playerHeightsBig = Array(0, 170, 80, 250, 250, 27);
var playerWidthsBig = Array(0, 570, 570, 570, 570, 570);
var NUMSONGS = 10;
var BANNED = Array(String.fromCharCode(34), 
                   String.fromCharCode(38),
                   String.fromCharCode(60),
                   String.fromCharCode(62),
                   String.fromCharCode(47),
                   String.fromCharCode(92)
                   )

// Check title/artist boxes to see if they contain banned characters
function checkDeets(panel) {
    v = panel.parents(".confirmholder").find(".songtitle").val() + panel.parents(".confirmholder").find(".songartist").val() + panel.parents(".confirmholder").find(".songreason").val();
    console.log(v);
    for (i=0; i<BANNED.length; i++) {
        if (v.indexOf(BANNED[i]) > -1) {return true;}
        }
    return false;
    }

// Return the number of a given panel from its id
function panelNumber(id) {
    return parseInt(id.slice(0, id.indexOf("tabs")));    
    }

// Transform string to title case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

// Main function to embed player in DOM
function embedPlayer(l, provider) {
    if ($("body").css("width") === "620px") {
        w = playerWidthsBig[provider];
        h = playerHeightsBig[provider];                
        }
    else {
        w = playerWidthsSmall[provider];
        h = playerHeightsSmall[provider];                    
        }
    switch(provider) {
        case 1:
            return 'Use <strong>scloudPlayer</strong> rather than <strong>embedPlayer</strong>';
        case 2:
            return '<iframe src="https://embed.spotify.com/?uri=' + l + '" width="' + w + '" height="' + h + '" frameborder="0" allowtransparency="true"></iframe>';
        case 3:
            return '<iframe class="youtube-player" type="text/html" width="' + w + '" height="' + h + '" src="http://www.youtube.com/embed/' + l + '" allowfullscreen frameborder="0"></iframe>';
        case 4:
            return '<iframe class="vimeo-player" src="http://player.vimeo.com/video/' + l + '" width="' + w + '" height="' + h + '" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
        case 5:
            return '<embed type="application/x-shockwave-flash" flashvars="audioUrl=' + l + '" src="http://www.google.com/reader/ui/3523697345-audio-player.swf" width="' + w + '" height="' + h + '" quality="best"></embed>';
        }
   }
        
// Function to embed SoundCloud player
function scloudPlayer(url, panelnum) {
    if ($("body").css("width") === "620px") {
        w = playerWidthsBig[1];
        h = playerHeightsBig[1];                
        }
    else {
        w = playerWidthsSmall[1];
        h = playerHeightsSmall[1];                    
        }    
     xhr = $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: w, maxheight: h, auto_play: false, show_comments: false},
        dataType: "json",
        });
    xhr.panelnum = panelnum;
    return xhr
    }

// Embed YouTube Player
function youtubePlayer(url) {
    var params = { allowScriptAccess: "always" };
    var atts = { id: "ytplayer" };
    swfobject.embedSWF("http://www.youtube.com/v/" + url + "?enablejsapi=1&playerapiid=ytplayer&version=3&autoplay=1",
                       "tempdiv", playerwidths[3], playerheights[3], "8", null, null, params, atts);
    }

// Add an event listener in a cross-browser function
function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
        }
    else {
        element.attachEvent('on' + eventName, callback);
        }     
    }

// Update the accordion headers to reflect new songdeets array
function updateSongDisplay() {
    for (i=1; i<num_songs+1; i++) {
        headobj = $("#"+i+"header")
        headobj.find(".songtitleartist").html(
            '<div class="titleartist">' + i + '. <strong>' + songdeets[i-1][0] + '</strong> by <strong>' + songdeets[i-1][1] +
            '</strong><input type="hidden" class="currenttitle" value="' + songdeets[i-1][0] + '"><input type="hidden" class="currentartist" value="' + songdeets[i-1][1] +
            '"></div><div class="reason"><div>' + songdeets[i-1][2] + '</div></div>'
            );
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        showTitleArtist(headobj);  
        }  
    } 