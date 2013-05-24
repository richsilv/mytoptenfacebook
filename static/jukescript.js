$(function() {
    
    updateSong(songnum);
    doSetup();

});

var playerheights = Array(0, 80, 80, 220, 200, 183);
var playerwidths = Array(0, 250, 290, 290, 290, 290);
var NUMSONGS = 3;

// ********************************

window.onYouTubePlayerReady = function(playerId) {
    var p = document.getElementById(playerId);
    p.addEventListener('onStateChange', 'youtubeStateChange');
    }   
   

function doSetup() {

    $("#buttonbar").find("button").button();

    $('#edit').on("click", function() {
        window.location = "/make_songs/" + facebook_id + '/False';        
        });
        
    $('#home').on("click", function() {
        window.location = "/show_songs/" + user_id;        
        });

    $('#friends').on("click", function() {
        window.location = "/friends_list/" + user_id;        
        });            
                
    $("#accordion").on("tabsbeforeactivate", ".panel .tabset", function(e, ui) {
        if (ui.newPanel.length) {
            panel = ui.newPanel;
            }
        else {
            panel = ui.oldPanel;
            }
        if ($(this).parents(".panel").prev().find('.songentry').is(":visible")) {
            songtitle = $(this).parents(".panel").prev().find('.titleentry').val();
            songartist = $(this).parents(".panel").prev().find('.artistentry').val();
            }
        else {
            songtitle = $(this).parents(".panel").prev().find('.currenttitle').val();
            songartist = $(this).parents(".panel").prev().find('.currentartist').val();
            }
        provider = panel.attr("id").slice(-1);
        $.post('/get_selector/', {'songtitle': songtitle, 'songartist': songartist, 'provider': provider}, function(r) {
            panel.html(r);
            panel.find(".choosebutton").button({
                icons: {primary: "ui-icon-circle-check"},
                text: false
                });
            panel.find(".cancelbutton").button({
                icons: {primary: "ui-icon-circle-close"},
                text: false
                });
            });
        });

    $(".slider").mouseenter(function() {
        $(this).addClass("ui-state-hover");
        }).mouseleave(function() {
            $(this).removeClass("ui-state-hover");
            });

    $(".slider").on("click", function() {
        if ($(this).hasClass("closed")) {
            $(this).addClass("open").removeClass("closed");
            $(this).animate({"margin-left": '-420px'});
            $(this).parents(".lefthalf").find(".reasonbox").animate({"padding-right": '450px'});            
            $(this).parents('.lefthalf').next('.playerbox').animate({"margin-left": "-320px"}, function() {
                $(this).css("display", "block");
                });         
            }
        else if($(this).hasClass("open")) {
            $(this).addClass("closed").removeClass("open");
            $(this).parents('.lefthalf').next('.playerbox').css("display", "none");
            $(this).parents(".lefthalf").find(".reasonbox").animate({"padding-right": '140px'});
            $(this).animate({"margin-left": '-110px'});
            $(this).parents('.lefthalf').next('.playerbox').animate({"margin-left": "0"});         
            }
        });
    
    for (panelnum=1; panelnum<songdeets.length+1; panelnum++) {
        if (songdeets[panelnum-1][2] === "") { $("#"+panelnum+"panel").find(".slider").click(); }
        }
}

// **************************************************************
function updateSong(songnum) {
    var provider = parseInt(songdeets[songnum][4]);   
    var w = playerwidths[provider]; 
    
    switch(provider) {
        case 1: 
            var promise = scloudPlayer(songdeets[songnum][3], 0);
            promise.success(function(result, responsecode, xhr) {
                $('#jukeplayer').html(result.html);
                var iframe = document.querySelector('#jukeplayer iframe');
                widget = SC.Widget(iframe);
                widget.bind(SC.Widget.Events.FINISH, function(player, data) {
                  playNextTrack();                  
                  });
                });        
            break;
        case 2:
            $('#jukeplayer').html(embedPlayer(songdeets[songnum][3], 2));            
            break;
        case 3:
            $('#jukeplayer').html('<div id="tempdiv"></div>');
            youtubePlayer(songdeets[songnum][3]);
            break;     
        case 4:
            $('#jukeplayer').html(embedPlayer(songdeets[songnum][3], 4));
            addEvent(window, "message", vimeoMessageHandler);
            break;        
        case 5:
            $('#jukeplayer').html(embedPlayer(songdeets[songnum][3], 5));  
            var audio = document.querySelector('#jukeplayer audio');
            console.log(audio)
            audio.addEventListener('ended', function() {                
                playNextTrack();
                }, false);          
            break; 
        }

    $('#jukeplayer').children("iframe").css("height", playerheights[provider]+"px");
    $('#jukeplayer').css("width", (w) + "px");
    $('#details').css("width", (650 - w) + "px");
    
    $('#details').html("<p><strong>" + songdeets[songnum][0] + "</strong> by <strong>" + songdeets[songnum][1] + "</strong>, chosen by <strong>" + songdeets[songnum][5] + "</strong></p>");
    $('#jukereason').html('<h4>"' + songdeets[songnum][2] + '"</h4>');
    
    }

function vimeoMessageHandler(e) {
    var data = JSON.parse(e.data);
    if (data.event === 'ready') {post('addEventListener', 'finish');}
    if (data.event === 'finish') {playNextTrack();}
    }

function post(action, value) {
    var f = $('#jukeplayer iframe')
    var url = f.attr('src').split('?')[0];
    var data = { method: action };
    
    if (value) {
        data.value = value;
    }
    
    f[0].contentWindow.postMessage(JSON.stringify(data), url);
} 

function youtubeStateChange(newState) {
    if (newState === 0) { playNextTrack(); }
    }

function playNextTrack() {
    var provider = parseInt(songdeets[songnum][4]);
    switch(provider) {
        case 1:
            var iframe = document.querySelector('#jukeplayer iframe');
            widget = SC.Widget(iframe);
            widget.unbind(SC.Widget.Events.FINISH);            
            break;
        case 3:
            break;
        }
    if (songnum + 1 < listlength) {
        songnum += 1;
        updateSong(songnum)        
        }
    else {
        console.log("last song")        
        }
    }

function embedPlayer(l, provider) {
    switch(provider) {
        case 1:
            return 'Use <strong>scloudPlayer</strong> rather than <strong>embedPlayer</strong>';
        case 2:
            return '<iframe src="https://embed.spotify.com/?uri=' + l + '" width="290" height="80" frameborder="0" allowtransparency="true"></iframe>';
        case 3:
            return '<iframe class="youtube-player" type="text/html" width="290" height="220" src="http://www.youtube.com/embed/' + l + '?autoplay=1&enablejsapi=1&playerapiid=ytplayer" allowfullscreen frameborder="0"></iframe>';
        case 4:
            return '<iframe id="vimeo-player" src="http://player.vimeo.com/video/' + l + '?api=1&autoplay=1" width="290" height="220" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
        case 5:
            return '<audio autoplay="autoplay" controls="controls" style="margin-top: 30px"><source src="' + l + '" type="audio/mpeg">Your browser does not support the audio tag.</audio>'
/*            return '<embed type="application/x-shockwave-flash" flashvars="audioUrl=' + l + '" src="http://www.google.com/reader/ui/3523697345-audio-player.swf" width="290" height="27" quality="best"></embed>';
*/
        case 6:
            return '<iframe scrolling="no" frameborder="0" allowTransparency="true" src="http://www.deezer.com/en/plugins/player?autoplay=false&playlist=true&width=290&height=183&cover=false&type=tracks&id=' + l + '&title=&format=vertical&app_id=undefined" width="290" height="183"></iframe>';        
        }
   }
        
function scloudPlayer(url, panelnum) {
     xhr = $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: 290, maxheight: 150, auto_play: true, show_comments: false},
        dataType: "json",
        });
    xhr.panelnum = panelnum;
    return xhr
    }    

function youtubePlayer(url) {
    var params = { allowScriptAccess: "always" };
    var atts = { id: "ytplayer" };
    swfobject.embedSWF("http://www.youtube.com/v/" + url + "?enablejsapi=1&playerapiid=ytplayer&version=3&autoplay=1",
                       "tempdiv", "290", "220", "8", null, null, params, atts);
    }

function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
        }
    else {
        element.attachEvent('on' + eventName, callback);
        }     
    }