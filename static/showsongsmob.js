// Functions to execute on page load
$(function() {

    // Setup necessary variable
    var selection = Array();
    var provider = Array();
    var player = Array();
    var promise = Array();
    
    // Setup tabs and load in players using Python backend (AJAX)
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
    
    // Setup buttons on bottom bar    
    $('#home').on("click", function() {
        window.location = "/show_songs_mob/" + user_id;        
        });

    $('#edit').on("click", function() {
        window.location = "/make_songs_mob/" + user_id + "/False";        
        });

    $('#friends').on("click", function() {
        window.location = "/friends_list_mob/" + user_id;        
        });            

    // Setup tab open/close on header click
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

    // Setup slider to show/hide song reason and player
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
    
    // Close slider and show player automatically if there is no comment attached to a given song
    for (panelnum=1; panelnum<songdeets.length+1; panelnum++) {
        if (songdeets[panelnum-1][2] === "") { $("#"+panelnum+"panel").find(".slider").click(); }
        }
});