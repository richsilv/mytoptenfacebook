$(function() {
    
    doUpdate();
    doSetup();

});

var playerheights = Array(0, 80, 80, 200, 200);
var playerwidths = Array(0, 250, 290, 290, 290);
var NUMSONGS = 3;

// ********************************

function doUpdate() {
    
    var selection = Array();
    var provider = Array();
    var player = Array();
    var promise = Array();
    
    for (panelnum=1; panelnum<songdeets.length+1; panelnum++) {
        selection[panelnum] = songdeets[panelnum-1][3];
        provider[panelnum] = parseInt(songdeets[panelnum-1][4]);
        player[panelnum] = $("#"+panelnum+"panel").find(".player");
        if (provider[panelnum] === 1) {
            promise[panelnum] = scloudPlayer(selection[panelnum], panelnum);
            promise[panelnum].success(function(result, responsecode, xhr) {
                player[xhr.panelnum].html(result.html);
                });
            }
        else {
            player[panelnum].html(embedPlayer(selection[panelnum], provider[panelnum]));                                
            }
        player[panelnum].children("iframe").css("height", playerheights[provider[panelnum]]+"px");
        player[panelnum].siblings(".reason").css("margin-top", Math.max(0, (playerheights[provider[panelnum]]/2)-15)+"px")                    
        }        
        
    }


function doSetup() {

/*-    $('#edit').on("click", function() {
        window.location = "/make_songs_mob/" + facebook_id + '/False';        
        });   -*/
        
    $('#home').on("click", function() {
        window.location = "/show_songs_mob/" + user_id;        
        });

    $('#edit').on("click", function() {
        window.location = "/make_songs_mob/" + user_id + "/False";        
        });

    $('#friends').on("click", function() {
        window.location = "/friends_list_mob/" + user_id;        
        });            

    $(".header").on("click", function() {
        if ($(this).hasClass("closed")) {
            $(this).addClass("open").removeClass("closed");
            $(this).next(".showpanel").css("display", "block");                       
            }
        else if ($(this).hasClass("open")) {
            $(this).addClass("closed").removeClass("open");
            $(this).next(".showpanel").css("display", "none");               
            }
        });


    $(".slider").on("click", function() {       
        if ($(this).hasClass("closed")) {
            $(this).addClass("open").removeClass("closed");
            $(this).find('h3').html("Reason");
            $(this).prev(".reasonbox").css("display", "none");
            $(this).next(".playerbox").css("display", "block");       
            }
        else if($(this).hasClass("open")) {
            $(this).addClass("closed").removeClass("open");
            $(this).find('h3').html("Player");
            $(this).prev(".reasonbox").css("display", "block");
            $(this).next(".playerbox").css("display", "none");    
            } 
        });   
    
    for (panelnum=1; panelnum<songdeets.length+1; panelnum++) {
        if (songdeets[panelnum-1][2] === "") { $("#"+panelnum+"panel").find(".slider").click(); }
        }
}

// **************************************************************
function panelNumber(id) {
    return parseInt(id.slice(0, id.indexOf("tabs")));    
    }


function embedPlayer(l, provider) {
    switch(provider) {
        case 1:
            return 'Use <strong>scloudPlayer</strong> rather than <strong>embedPlayer</strong>';
        case 2:
            return '<iframe src="https://embed.spotify.com/?uri=' + l + '" width="290" height="80" frameborder="0" allowtransparency="true"></iframe>';
        case 3:
            return '<iframe class="youtube-player" type="text/html" width="290" height="200" src="http://www.youtube.com/embed/' + l + '" allowfullscreen frameborder="0"></iframe>';
        case 4:
            return '<iframe class="vimeo-player" src="http://player.vimeo.com/video/' + l + '" width="290" height="200" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
        case 5:
            return '<embed type="application/x-shockwave-flash" flashvars="audioUrl=' + l + '" src="http://www.google.com/reader/ui/3523697345-audio-player.swf" width="290" height="27" quality="best"></embed>';
        }
   }
        
function scloudPlayer(url, panelnum) {
     xhr = $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: 290, maxheight: 150, auto_play: false, show_comments: false},
        dataType: "json",
        });
    xhr.panelnum = panelnum;
    return xhr
    }    
    