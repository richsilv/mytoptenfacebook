// Functions to execute on page load
$(function() {
    
    doUpdate();
    doSetup();

});

// Bindings that need to be rerun every time a song is entered or amended.
function doUpdate() {
    
    // Set up accordion
    $( "#accordion" ).accordion({
        header: "> div > h3",
        heightStyle: "content",
        collapsible: false,
        active: num_songs
        }).sortable({
        axis: "y",
        handle: ".header",
        stop: function( event, ui ) {
            ui.item.children( "h3" ).triggerHandler( "focusout" );
            if (ui.item.children(".header").hasClass("newsong")) {
                ui.item.appendTo(this);
                }
            neworder = newOrder().slice(0,num_songs);
            songdeets = newDeets(neworder);
            renamePanels(neworder);
            updateSongDisplay();
            }
        });

    // Set up tabsets
    for (i=1; i<num_songs+2 ; i++) {
        $( "#"+i+"tabs" ).tabs({
            active: false,
            collapsible: true,
            });
        }
    $( "#10header" ).css("padding-left", "26px");
    $(".selector").hide();

    // Amend some formatting
    $( ".ui-tabs-nav, .ui-tabs-nav > *" )
        .removeClass( "ui-corner-top" )
        .addClass( "ui-corner-all" );
    $(".ui-tabs-nav").css("padding", ".2em");

    // Set up buttons
    $(".cancelchange").button({
                icons: {primary: "ui-icon-circle-close"},
                text: false
                });
                
    $(".suggest").button({
                icons: {primary: "ui-icon-lightbulb"},
                text: false
                });

    // Flash the lightbulb icon on page load
    $(".suggest").effect("highlight", {}, 400).effect("highlight", {}, 400).effect("highlight", {}, 400);

    // If there are NO songs currently entered, display basic instructions
    if (num_songs === 0) {
        $('#enter-search').css("display", "block");
        }
    // If there are more than three entered, hide all istructions 
    else if (num_songs > 1) {
        $('.popbelow').css("display", "none");    
        }
    // Otherwise, show the save instructions
    else {
        $('.popbelow').css("display", "none");    
        $('#save-info').css("display", "block");                
        }      

    }

// Functions to run once on page load
function doSetup() {

	// Facilitate Facebook integration
    window.fbAsyncInit = function() {
        FB.Canvas.setAutoGrow();
        };

    // Asynchronously load suggestions for later
    $.post('/load_suggestions/')
    
    // Set up dialogue boxes
    $( "#dialog-modal" ).dialog({
        width: 570,        
        height: 302,
        modal: true
        });  
        
    $( "#bad-data" ).dialog({
        width: 325,        
        height: 200,
        modal: true,
        autoOpen: false
        });   

    $( "#songs-saved" ).dialog({
        width: 325,        
        height: 200,
        modal: true,
        autoOpen: false
        });  

    $( "#suggestions" ).dialog({
        width: 650,        
        height: 425,
        modal: true,
        autoOpen: false
        }); 

    $( "#post-timeline" ).dialog({
        width: 520,        
        height: 290,
        modal: true,
        autoOpen: false
        });
    // Need to amend some formatting to look nice on iPads
    if (navigator.userAgent.indexOf("iPad") != -1) { $("#confirm-message").attr("cols", "43"); }
    $( "#post-timeline" ).find("button").button()

// ************* BOTTOM BAR ******************

    // Set up buttons on bottom bar
    $("#buttonbar").find("button").button(); 
    if (!existing_ten) {
        $("#cancel").button("option", "disabled", true)
        $("#confirm").button("option", "disabled", true);
        };

    // Return to Show Songs (if applicable) on "Cancel" click
    $('#cancel').on("click", function() {
        window.location = "/show_songs/" + facebook_id;        
        });
        
    // Save songs and return to Show Songs on "Confirm" click
    $('#confirm').on("click", function() {
        $("#confirm-message").html("I just updated my list on MyTopTen!");
        $("#post-timeline").dialog("open");
        });

    // Post to timeline button logic
    $('#post').on("click", function() {
        $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id, 'message': $("#post-timeline").html()}, function(r) {
            window.location = "/show_songs/" + facebook_id;        
            });        
        });
    $('#no-message').on("click", function() {
        $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id, 'message': ''}, function(r) {
            window.location = "/show_songs/" + facebook_id;
            });  
        });
    $("#confirm-message").on("keypress", function(e) {
        if (e.which === 13) {
            $("#post").click();
            }
        });

// *********** INITIAL SONG ENTRY ***********

    // Toggle flip between saved title/artist and new entry boxes
    $('#accordion').on("click", '.header .songtitleartist strong', function() { hideTitleArtist($(this).parents('.header')) });
    $('#accordion').on("click", '.header .songentry form', function(e) {
        if (e.target === this) { showTitleArtist($(this).parents('.header')); }
        });

    // On selection of new row, switch back to saved title/artist on old row, and clear player (if applicable)
    $('#accordion').on("accordionactivate", function(e, ui) {
        if ((ui.oldHeader.length) && !(ui.oldHeader.hasClass("newsong"))) {
            showTitleArtist(ui.oldHeader);           
            }
        if (ui.oldPanel.length) {
            ui.oldPanel.find("[aria-expanded='true']").html("");        
            }
        });
    
    // On "X" click, clear title/artist entry and show saved title/artist (if applicable)
    $('#accordion').on("click", ".header .songentry form .cancelchange", function() {
        $(this).siblings(".titleentry").val("");
        $(this).siblings(".artistentry").val("");
        if (!$(this).parents(".header").hasClass("newsong")) {showTitleArtist($(this).parents(".header"))} 
        });
    
    // On "lightbulb" click, pull suggestions from AJAX call to Python back-end and display in suggestions dialog
    $('#accordion').on("click", ".header .songentry form .suggest", function() {
        var songnum = panelNumber(($(this).parents(".header").attr("id")));
        $.post('/get_suggestions/', {'facebook_id': facebook_id, 'songnum': songnum}, function(r) {
            $('#suggestions').html(r);
            $('#suggestions').dialog("open");
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
        $('#suggestions').dialog("close");  
        $("#" + songnum + "header").find(".artistentry").focus();      
        });

// ************* SELECTION TAB **************
    
    // When new tab is selected, throw title and artist to Python back-end (AJAX) and throw into tab contents
    $("#accordion").on("tabsbeforeactivate", ".panel .tabset", function(e, ui) {
        if (ui.newPanel.length) {
            panel = ui.newPanel;
            }
        else {
            panel = ui.oldPanel;
            }
        if (ui.oldPanel.length) {
            ui.oldPanel.html("");        
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
            if (panel.children(".noresults").length > 0) {
                panel.css("height", "50px");
                }
            else {
                panel.css("height", "auto");               
                }
            // set up new buttons
            panel.find(".choosebutton").button({
                icons: {primary: "ui-icon-circle-check"},
                text: false
                });
            panel.find(".cancelbutton").button({
                icons: {primary: "ui-icon-circle-close"},
                text: false
                });
            panel.find('.selectmenu').focus();
            });
        if (num_songs === 0) {
            $('#enter-search').css("display", "none");
            $('#choose-song').css("display", "block");
            }
        });
    
    // Show the tab (provider) selection when enter is pressed from either the title or artist entry box
    $("#accordion").on("keypress", ".header .songentry form input", function(e) {
        if (e.which === 13) {
            t = $(this).parents(".header").next().find(".tabset");
            if (t.tabs("option", "active")) {
                a = t.tabs("option", "active");
                t.tabs("option", "active", false);
                t.tabs("option", "active", a);
                }
            else {
                t.tabs("option", "active", 0);
                }
            }
        });
    
    // Close entry details and save when enter is pressed in the reason entry box
    $("#accordion").on("keypress", ".panel .tabset .selector .confirmholder .confirm input, .panel .tabset .selector .confirmholder .reasoninput input", function(e) {
        if (e.which === 13) {
            $(this).parents(".confirmholder").find(".confirmbutton").click();
            }
        });
        
    // Reload player when song selection changes
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
        player.children("iframe").css("height", playerheights[provider]+"px");
        player.siblings(".selection").css("margin-top", Math.max(0, (playerheights[provider]/2)-15)+"px")
        });

    // Clear all details and return to saved title/artist (if applicable) when cancel button is hit - THIS SHOULD BE MADE REDUNDANT
    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .cancelbutton", function() {
        var headobj = $(this).parents(".panel").prev();       
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        if (!headobj.hasClass("newsong")) {showTitleArtist(headobj)}
        $(this).parents(".tabset").tabs("option", "active", false)
        });
        
    // When selection is accepted ("tick" clicked) get confirm form
    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .choosebutton", function() {
        var panel = $(this).parents(".selector");
        var provider = parseInt(panel.attr("id").slice(-1));
        var songdeets = $.parseJSON(panel.find(".selectmenu").val());
        var songtag = songdeets.url;
        var songtitle = songdeets.title;
        var songartist = songdeets.artist;
        $.post('/get_confirm/', {'songtitle': songtitle, 'songartist': songartist, 'songtag': songtag, 'provider': provider}, function(r) {
            panel.html(r);
            panel.find(".confirmbutton").button({
                icons: {primary: "ui-icon-circle-check"},
                text: false
                });
            panel.find(".cancelbutton").button({
                icons: {primary: "ui-icon-circle-close"},
                text: false
                });
            header = panel.parents(".panel").prev(".header");
            if (header.find(".songtitleartist").css("display") != "none") {
                panel.find(".songtitle").val(header.find(".currenttitle").val());
                panel.find(".songartist").val(header.find(".currentartist").val());
                panel.find(".songreason").val(header.find(".reason").children("div").text());
                }
            });
            if (num_songs === 0) {
                $('#choose-song').css("display", "none");
                $('#enter-deets').css("display", "block");
                }
        });

// ************** CONFIRMATION TAB ****************
 
    // When "cancel" is clicked from confirm form, close tab and revert to saved song title/artist, clearing title/artist entry boxes    
    $("#accordion").on("click", ".panel .tabset .selector .confirmholder .buttons .cancelbutton", function() {
        var headobj = $(this).parents(".panel").prev();       
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        if (!headobj.hasClass("newsong")) {showTitleArtist(headobj)}
        $(this).parents(".tabset").tabs("option", "active", false)
        });

    // On confirm "tick" click, check song details are acceptable, add song to songlist and AJAX new tab or simply replace existing one.
    $("#accordion").on("click", ".panel .tabset .selector .confirmholder .buttons .confirmbutton", function() {
        var songnum = panelNumber(($(this).parents(".selector").attr("id")));
        if (!checkDeets($(this))) {
        	// If this song forms a new row, follow this route
            $('#enter-deets').css("display", "none");
            if (songnum > num_songs) {
                songdeets.push(Array($(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                    $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()));
                $("#"+songnum+"header").removeClass('newsong');
                num_songs += 1;
                // If this isn't the last available slot, call for another from Python back-end
                if (num_songs < NUMSONGS) {
                    $.post('/new_panel/', {'newsong': num_songs+1}, function(r) {
                        $('#accordion').append(r).accordion("destroy");
                        doUpdate();
                        $(".suggest").effect("highlight", {}, 400).effect("highlight", {}, 400).effect("highlight", {}, 400);
                        });
                    }
                }
            // Otherwise, simply overwrite the old song
            else {
                songdeets[songnum-1] =[$(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                    $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()];        
                }
            // If this is the tenth song, and there is no existing top ten, automatically confirm the song list
            if ((num_songs === NUMSONGS) && (!existing_ten)) {
                $("#confirm-message").html("I just updated my list on MyTopTen!");
                $("#post-timeline").dialog("open");
                $('#confirm').button("option", "disabled", false)                                       
                } 
            // Otherwise, just save the new list
            else {
                $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id});            
                }
            $("#"+songnum+"tabs").tabs("option", "active", false);
            updateSongDisplay();
            $("#accordion").accordion("option", "active", num_songs);
            setTimeout(function() {
                $("#"+num_songs+"header").find(".titleentry").focus();
                }, 100);
            }
        else {
             $("#bad-data").dialog("open");               
            }
        });
    }