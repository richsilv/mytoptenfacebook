$(function() {
    
    doUpdate();
    doSetup();

});

var playerheights = Array(0, 80, 80, 200, 200);
var NUMSONGS = 3;

// ********************************

function doUpdate() {

    $(".selector").hide();

    }

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

function doSetup() {
    
    if (!existing_ten) { $("#cancel").css("background-color", "#dfe3ee").css("cursor", "default").css("color", "grey")};
    $("#confirm").css("background-color", "#dfe3ee").css("cursor", "default").css("color", "grey")

    $('#cancel').on("click", function() {
        if (existing_ten) {
            window.location = "/show_songs/" + facebook_id;                    
            }
        });
        
    $('#confirm').on("click", function() {
        if ($(this).css("cursor") == "pointer") {
            $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id}, function(r) {
                window.location = "/show_songs/" + facebook_id;        
                });
            }            
        });
        
    $('#close').on("click", function() {
        $('#dialog-modal').css("display", "none");
        });

    $('#accordion').on("click", '.header .songtitleartist strong', function() { hideTitleArtist($(this).parents('.header')) });
    $('#accordion').on("click", '.header .songentry form', function(e) {
        if (e.target === this) { showTitleArtist($(this).parents('.header')); }
        });

    $('#accordion').on("accordionactivate", function(e, ui) {
        if ((ui.oldHeader.length) && !(ui.oldHeader.hasClass("newsong"))) {
            showTitleArtist(ui.oldHeader);           
            }    
        });
    
    $('#accordion').on("click", ".header .songentry form .cancelchange", function() {
        $(this).siblings(".titleentry").val("")
        $(this).siblings(".artistentry").val("")
        if (!$(this).parents(".header").hasClass("newsong")) {showTitleArtist($(this).parents(".header"))} 
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
            if (panel.children(".noresults").length > 0) {
                panel.css("height", "50px");
                }
            else {
                panel.css("height", "auto");               
                }
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
        });
    
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
        
    $("#accordion").on("keypress", ".panel .tabset .selector .confirmholder .confirm input, .panel .tabset .selector .confirmholder .reasoninput input", function(e) {
        if (e.which === 13) {
            $(this).parents(".confirmholder").find(".confirmbutton").click();
            }
        });
        
    $("#accordion").on("focus change", ".panel .tabset .selector .selection .selectmenu", function() {
        var selection = $.parseJSON($(this).val()).url;
        var provider = parseInt($(this).parents(".selector").attr("id").slice(-1));
        var player = $(this).parents(".selector").find(".player");
        if (provider === 1) {
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

    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .cancelbutton", function() {
        var headobj = $(this).parents(".panel").prev();       
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        if (!headobj.hasClass("newsong")) {showTitleArtist(headobj)}
        $(this).parents(".tabset").tabs("option", "active", false)
        });
        
    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .choosebutton", function() {
        var panel = $(this).parents(".selector");
        var provider = parseInt(panel.attr("id").slice(-1));
        var songdeets = $.parseJSON(panel.find(".selectmenu").val());
        var songtag = songdeets.url;
        var songtitle = songdeets.title;
        var songartist = songdeets.artist;
/*        else {
            var songtitle = toTitleCase(panel.parents(".panel").prev().find(".titleentry").val());
            var songartist = toTitleCase(panel.parents(".panel").prev().find(".artistentry").val());
            }    */
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
        });
        
    $("#accordion").on("click", ".panel .tabset .selector .confirmholder .buttons .cancelbutton", function() {
        var headobj = $(this).parents(".panel").prev();       
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        if (!headobj.hasClass("newsong")) {showTitleArtist(headobj)}
        $(this).parents(".tabset").tabs("option", "active", false)
        });

    $("#accordion").on("click", ".panel .tabset .selector .confirmholder .buttons .confirmbutton", function() {
        var songnum = panelNumber(($(this).parents(".selector").attr("id")));
        if (songnum > num_songs) {
            songdeets.push(Array($(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()));
            $("#"+songnum+"header").removeClass('newsong');
            num_songs += 1;
            if (num_songs < NUMSONGS) {
                $.post('/new_panel/', {'newsong': num_songs+1}, function(r) {
                    $('#accordion').append(r).accordion("destroy");
                    doUpdate();
                    });
                }
            }
        else {
            songdeets[songnum-1] =[$(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()];        
            }
        if (num_songs === NUMSONGS) {
            $("#confirm").button("option", "disabled", false);            
            }
        $("#"+songnum+"tabs").tabs("option", "active", false);
        updateSongDisplay();
        $("#accordion").accordion("option", "active", num_songs);
        setTimeout(function() {
            $("#"+num_songs+"header").find(".titleentry").focus();
            }, 100);
        });

    }

// **************************************************************
function panelNumber(id) {
    return parseInt(id.slice(0, id.indexOf("tabs")));    
    }

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

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
        });
    }
 
function hideTitleArtist(header) {
    header.children('.songtitleartist').css("display", "none");
    header.children('.songentry').css("display", "inline-block");
        });
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
        
function scloudPlayer(url) {
    return $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: 290, maxheight: 150, auto_play: false, show_comments: false},
        dataType: "json"
        });
    }    
    