// Functions to execute on page load
$(function() {

    doUpdate();
    doSetup();

});

// Function to load selection menu (via AJAX) and buttons and put them into a given panel
function showSelect(panel, clicked) {
    if (clicked.parents(".panel").prev().find('.songentry').is(":visible")) {
        songtitle = clicked.parents(".panel").prev().find('.titleentry').val();
        songartist = clicked.parents(".panel").prev().find('.artistentry').val();
        }
    else {
        songtitle = clicked.parents(".panel").prev().find('.currenttitle').val();
        songartist = clicked.parents(".panel").prev().find('.currentartist').val();
        }
    provider = panel.attr("id").slice(-1);
    $.post('/get_selector/', {'songtitle': songtitle, 'songartist': songartist, 'provider': provider}, function(r) {
        panel.html(r);
        if (iconSize === "big") {
            panel.find(".buttons").html('<div class="cancelchange"><img src="/static/crossbig.png" alt="N" /></div><div class="confirmbutton"><img src="/static/tickbig.png" alt="Y" /></div>');               
            }
        else {
            panel.find(".buttons").html('<div class="confirmbutton"><img src="/static/ticksmall.png" alt="Y" /></div><div class="cancelchange"><img src="/static/crosssmall.png" alt="N" /></div>');            
            }
        if (panel.children(".noresults").length > 0) {
            panel.css("height", "50px");
            }
        else {
            if (num_songs === 0) {
                $('#choose-provider').css("display", "none");
                $('#choose-song').css("display", "block");
                }
            panel.css("height", "auto");
            }
        panel.find('.selectmenu').focus();
        });
    }

// Bindings that need to be rerun every time a song is entered or amended
function doUpdate() {

    $(".selector").hide();

    // Mess around a bit with the size and order of icons depending on screen size (from CSS)
    if (iconSize === "big") {
        $(".suggest img").attr("src", "/static/bulbbig.png")
        $(".cancelchange img").attr("src", "/static/crossbig.png")
        $(".suggest").insertAfter($(".cancelchange"));
        $(".suggest").next(".suggest").remove();
        }
    else {
        $(".suggest img").attr("src", "/static/bulbsmall.png")            
        $(".cancelchange img").attr("src", "/static/crosssmall.png")  
        } 

    // If there are NO songs currently entered, display basic instructions
    if (num_songs === 0) {
        $('#enter-search').css("display", "block");
        }
    // If there are more than three entered, hide all istructions 
    else if (num_songs > 3) {
        $('.popbelow').css("display", "none");    
        }
    // Otherwise, show the save instructions
    else {
        $('.popbelow').css("display", "none");    
        $('#save-info').css("display", "block");                
        }       
    
    }

// Functions to execute once on page load
function doSetup() {

    // Asynchronously load suggestions for later
    $.post('/load_suggestions/')

// ************ BOTTOM BAR **************

    // Disable "cancel" button if there's no current top ten to go back to
    if (!existing_ten) { $("#cancel").addClass("disabled")};
  
    $("#confirm").addClass("disabled");

    // On "cancel" click, return to Show Songs screen, if cancel is active
    $('#cancel').on("click", function() {
        if (!$(this).hasClass("disabled")) {
            window.location = "/show_songs_mob/" + facebook_id;                    
            }
        });
    
    // On "confirm" click, save songs and return to Show Songs screen, if confirm is active    
    $('#confirm').on("click", function() {
        if (!$(this).hasClass("disabled")) {
            $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id}, function(r) {
                window.location = "/show_songs_mob/" + facebook_id;        
                });
            }            
        });
    
// ********** DIALOGUE BOXES ************

    // Handler to close dialogue boxes when the "close" button is clicked on each
    $('.close').on("click", function() {
        $(this).parents(".popup").css("display", "none");
        });

// *********** INITIAL SONG ENTRY ***********

    // Show providers for any new entry line
    $('.newsong').next(".panel").css("display", "block")

    // Toggle between saved title/artist and title/artist entry boxes
    $('#accordion').on("click", '.header .songtitleartist strong', function() { 
        hideTitleArtist($(this).parents('.header'));   
        });
        
    $('#accordion').on("click", '.header .songentry form', function(e) {
        if ((e.target === this) && (!$(this).parents(".header").hasClass("newsong"))) {
            showTitleArtist($(this).parents('.header'));
            }
        });
    
    // Clear boxes and return to saved title/artist (if applicable) on "cross" click
    $('#accordion').on("click", ".header .songentry form .cancelchange", function() {
        $(this).siblings(".titleentry").val("")
        $(this).siblings(".artistentry").val("")
        if (!$(this).parents(".header").hasClass("newsong")) {showTitleArtist($(this).parents(".header"))}
        $(this).parents(".header").next(".panel").css("display", "none")        
        $(this).parents(".header").next(".panel").find("selector").css("display", "none")
        });

    // On "lightbulb" click, pull suggestions from AJAX call to Python back-end and display in suggestions dialog
    $('#accordion').on("click", ".header .songentry form .suggest", function() {
        var songnum = panelNumber(($(this).parents(".header").attr("id")));
        $.post('/get_suggestions/', {'facebook_id': facebook_id, 'songnum': songnum}, function(r) {
            $('#suggestions').html(r);
            $('#suggestionsholder').css("display", "block");
            });        
        });   

    // On "suggestion" click, close dialog, remove song from suggestions list and enter details in title/artist entry boxes
    $('#suggestions').on("click", "#songholder .songsuggestion", function() {
        var songnum = parseInt($(this).parents("#songholder").find("#songnum").val());
        var songtitle = $(this).nextAll(".sugtitle").val();
        var songartist = $(this).nextAll(".sugartist").val();
        $.post('/remove_suggestion/', {'songtitle': songtitle, 'songartist': songartist})     
        $("#" + songnum + "header").find(".titleentry").val(songtitle);
        $("#" + songnum + "header").find(".artistentry").val(songartist);
        $('#suggestionsholder').css("display", "none");
        $("#" + songnum + "header").find(".artistentry").focus();
        });

    // Show providers when a header is selected
    $('#accordion').on("click", ".header", function() {
        $(".header").next(".panel").css("display", "none");
        $(this).next(".panel").css("display", "block");
        if (num_songs === 0) {
            $('#enter-search').css("display", "none");
            $('#choose-provider').css("display", "block");
            }
        $(this).next(".panel").find('.selector').first().focus();
        });
    
// ************* SELECTION TAB ************

    // Show provider panel when provider button is clicked, and reassign formatting
    $('#accordion').on("click", ".panel .tabset ul .mobiminibutton", function() {
        panel = $(this).parents(".tabset").find($(this).find("span").attr("title"))
        $(this).siblings(".highlight").removeClass("highlight");        
        $(this).addClass("highlight");
        $(this).parents(".tabset").find(".clicked").removeClass("clicked").css("display", "none");
        panel.css("display", "block").addClass("clicked");
        showSelect(panel, $(this));
        });

    // Load player from Python back-end (AJAX) when new option is selected
    $("#accordion").on("focus change", ".panel .tabset .selector .selection .selectmenu", function() {
        var selection = $.parseJSON($(this).val()).url;
        var provider = parseInt($(this).parents(".selector").attr("id").slice(-1));
        var player = $(this).parents(".selector").find(".player");
        if (provider === 2) {
            var promise = scloudPlayer(selection);
            promise.success(function(result) {
                player.html(result.html);
                });
            }
        else {
            player.html(embedPlayer(selection, provider));                                
            }
        if (iconSize === "big") {
            h = playerHeightsBig[provider];
            }
        else {
            h = playerHeightsSmall[provider];
            }
        player.children("iframe").css("height", h+"px");
        player.siblings(".selection").css("margin-top", Math.max(0, (h/2)-15)+"px")
        });

    // Collapse panel, clear input boxes and return to saved title/artist (if applicable) on "cross" click
    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .cancelchange", function() {
        var headobj = $(this).parents(".panel").prev();       
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        if (!headobj.hasClass("newsong")) {showTitleArtist(headobj)}
        $(this).parents(".tabset").find("ul.highlight").removeClass("highlight");
        $(this).parents(".panel").css("display", "none");        
        $(this).parents(".selector").css("display", "none");
        });

    // Load confirm panel from Python back-end (AJAX) when "tick" is clicked
    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .confirmbutton", function() {
        var panel = $(this).parents(".selector");
        var provider = parseInt(panel.attr("id").slice(-1));
        var songdeets = $.parseJSON(panel.find(".selectmenu").val());
        var songtag = songdeets.url;
        var songtitle = songdeets.title;
        var songartist = songdeets.artist;
        $.post('/get_confirm/', {'songtitle': songtitle, 'songartist': songartist, 'songtag': songtag, 'provider': provider}, function(r) {
            panel.html(r);
            if (iconSize === "big") {
                panel.find(".buttons").html('<div class="cancelchange"><img src="/static/crossbig.png" alt="N" /></div><div class="confirmbutton"><img src="/static/tickbig.png" alt="Y" /></div>');               
                }
            else {
                panel.find(".buttons").html('<div class="confirmbutton"><img src="/static/ticksmall.png" alt="Y" /></div><div class="cancelchange"><img src="/static/crosssmall.png" alt="N" /></div>');            
                }
            header = panel.parents(".panel").prev(".header");
            if (num_songs === 0) {
                $('#choose-song').css("display", "none");
                $('#enter-deets').css("display", "block");
                }
            });
        });

// ************** CONFIRMATION TAB ****************

    // Check details and save songs on "tick" click
    $("#accordion").on("click", ".panel .tabset .selector .confirmholder .buttons .confirmbutton", function() {
        var songnum = panelNumber(($(this).parents(".selector").attr("id")));
        if (!checkDeets($(this))) {
            if (num_songs === 0) {
                // Hide instructions if first song has now been entered
                $('#enter-deets').css("display", "none");
                }
            // Add song to the songdeets array if this is a new panel
            if (songnum > num_songs) {
                songdeets.push(Array($(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                    $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()));
                $("#"+songnum+"header").removeClass('newsong');
                num_songs += 1;
                // If there's room for another panel, call for one from Python back-end (AJAX) and update display
                if (num_songs < NUMSONGS) {
                    $.post('/new_panel_mob/', {'newsong': num_songs+1}, function(r) {
                        $('#accordion').append(r);
                        doUpdate();
                        });
                    }
                }
            // Otherwise replace the existing song in the array
            else {
                songdeets[songnum-1] =[$(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                    $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()];        
                }
            // If this is the first time user has entered their final song, automatically confirm the list
            if ((num_songs === NUMSONGS) && (!existing_ten)) {
                $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id}, function(r) {
                    window.location = "/show_songs_mob/" + facebook_id;        
                    });                     
                }
            // Otherwise, just save the songs (AJAX)
            else {
                $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id});                            
                }
            $(this).parents(".panel").css("display", "none");
            // Update display
            updateSongDisplay();
            $(this).parents(".panel").prev(".header").children(".songentry").css("display", "none");
            }
        else {
            $("#bad-data").css("display", "block");
            baddata = true;
            }        
        });

    }