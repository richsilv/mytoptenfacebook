// ******* Overwrite player sizes to make them larger *******
playerheights = Array(0, 80, 80, 220, 220, 183);
playerwidths = Array(0, 250, 290, 365, 365, 300);

// ********** Functions to execute on page load *************
$(function() {
    
    doSetup();
    updateSong(songnum);

});

// *********  Functions to run once on page load ************
function doSetup() {

    // YouTube state change listener
    window.onYouTubePlayerReady = function(playerId) {
        var p = document.getElementById(playerId);
        p.addEventListener('onStateChange', 'youtubeStateChange');
        }   
    
    // Setup dialogue box   
    $( "#dialog-modal" ).dialog({
        width: 570,        
        height: 230,
        modal: true
        }); 

    // Setup button bar and buttons thereon
    $("#buttonbar").find("button").button();
    $("#changesong").find("button").button();
    
    $('#edit').on("click", function() {
        window.location = "/make_songs/" + facebook_id + '/False';        
        });
        
    $('#home').on("click", function() {
        window.location = "/show_songs/" + user_id;        
        });

    $('#friends').on("click", function() {
        window.location = "/friends_list/" + user_id;        
        });            
    
    // Setup next and previous buttons
    $('#next').on("click", function() {
        playNextTrack(1);
        });    

    $('#prev').on("click", function() {
        playNextTrack(-1);
        });   
}

// ********* Move current track by 'offset' *************
function playNextTrack(offset) {
    if(typeof(offset)==='undefined') offset = 1;
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
    songnum += offset;
    songnum = songnum % listlength;
    updateSong(songnum)
    }

// ********* Update all current song data and player ***********
function updateSong(songnum) {
    var provider = parseInt(songdeets[songnum][4]);   
    var w = playerwidths[provider]; 
    
    // Load and display new player
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
            audio.addEventListener('ended', function() {                
                playNextTrack();
                }, false);          
            break; 
        }

    // Resize player and details box
    $('#jukeplayer').children("iframe").css("height", playerheights[provider]+"px");
    $("#details").css("height", playerheights[provider]+"px");
    $('#jukeplayer').css("width", (w) + "px");
    $('#details').css("width", (685 - w) + "px");
    
    // Enter new song details
    $('#details').html("<p><strong>" + songdeets[songnum][0] + "</strong> by <strong>" + songdeets[songnum][1] + "</strong>, chosen by <strong>" + songdeets[songnum][5] + "</strong></p>");
    $('#jukereason').html('<h4>"' + songdeets[songnum][2] + '"</h4>');
    
    // Show previous song details and button (if there is one)
    if (songnum > 0) {
        $('#prevdeets').html("<p><strong>" + songdeets[songnum-1][0] + "</strong> by <strong>" + songdeets[songnum-1][1] + "</strong>, chosen by <strong>" + songdeets[songnum-1][5] + "</strong></p>");       
        $('#prev').button("option", "disabled", false);
        }
    else {
        $('#prevdeets').html("<p></p>");       
        $('#prev').button("option", "disabled", true);    
        }

    // Show next song details and button (if there is one)
    if (songnum + 1 < listlength) {
        $('#nextdeets').html("<p><strong>" + songdeets[songnum+1][0] + "</strong> by <strong>" + songdeets[songnum+1][1] + "</strong>, chosen by <strong>" + songdeets[songnum+1][5] + "</strong></p>");       
        $('#next').button("option", "disabled", false);        
        }    
    else {
        $('#nextdeets').html("<p></p>");       
        $('#next').button("option", "disabled", true);    
        }   
    }

// ************ Vimeo message handler **************
function vimeoMessageHandler(e) {
    var data = JSON.parse(e.data);
    // When a Vimeo video is loaded, add a listener to wait for it to finish
    if (data.event === 'ready') {post('addEventListener', 'finish');}
    // When the video finishes, move to next track
    if (data.event === 'finish') {playNextTrack();}
    }

// ************ YouTube message handler *************
function youtubeStateChange(newState) {
    if (newState === 0) { playNextTrack(); }
    }

// ****** Function to allow sending of messages to Vimeo player within iFrame ******
function post(action, value) {
    var f = $('#jukeplayer iframe')
    var url = f.attr('src').split('?')[0];
    var data = { method: action };
    if (value) {
        data.value = value;
    }
    f[0].contentWindow.postMessage(JSON.stringify(data), url);
} 

