$(function() {
    
    doUpdate();
    doSetup();

});

var playerHeightsSmall = Array(0, 80, 80, 200, 200, 27);
var playerWidthsSmall = Array(0, 290, 290, 290, 290, 290);
var playerHeightsBig = Array(0, 170, 80, 250, 250, 27);
var playerWidthsBig = Array(0, 570, 570, 570, 570, 570);
var NUMSONGS = 10;
var baddata = false;
var BANNED = Array(String.fromCharCode(34), 
                   String.fromCharCode(38),
                   String.fromCharCode(60),
                   String.fromCharCode(62),
                   String.fromCharCode(47),
                   String.fromCharCode(92)
                   );

// ********************************

function doUpdate() {

    $(".selector").hide();
    if ($("body").css("width") === "620px") {
        $(".searchbutton img").attr("src", "/static/tickbig.png")
        $(".cancelchange img").attr("src", "/static/crossbig.png")
        $(".searchbutton").insertAfter($(".cancelchange"));
        $(".searchbutton").next(".searchbutton").remove();
        }
    else {
        $(".searchbutton img").attr("src", "/static/ticksmall.png")            
        $(".cancelchange img").attr("src", "/static/crosssmall.png")  
        } 

    if (num_songs === 0) {
        $('#enter-search').css("display", "block");
        }
    else if (num_songs > 3) {
        $('.popbelow').css("display", "none");    
        }    
    else {
        $('.popbelow').css("display", "none");    
        $('#save-info').css("display", "block");                
        }       
    
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

    if ($("body").css("width") === "620px") {
        var iconSize = "big";
        }
    else {
        var iconSize = "small";        
        }
    
    if (!existing_ten) { $("#cancel").addClass("disabled")};
    if (num_songs === 0) {
        $('#enter-search').css("display", "block");
        }
    else if (num_songs > 3) {
        $('.popbelow').css("display", "none");    
        }    
    else {
        $('.popbelow').css("display", "none");    
        $('#save-info').css("display", "block");                
        }    

    if (!existing_ten) {
        $("#confirm").addClass("disabled");
        }

    $('#cancel').on("click", function() {
        if (existing_ten) {
            window.location = "/show_songs_mob/" + facebook_id;                    
            }
        });
        
    $('#confirm').on("click", function() {
        if (!$(this).hasClass("disabled")) {
            $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id}, function(r) {
                window.location = "/show_songs_mob/" + facebook_id;        
                });
            }            
        });

    $('#save').on("click", function() {
        if (!$(this).hasClass("disabled")) {
            $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id}, function(r) {
                $('#songs-saved').css("display", "block");      
                });
            }            
        });
        
    $('#close').on("click", function() {
        $('#dialog-modal').css("display", "none");
        });

    $('#closebad').on("click", function() {
        $('#bad-data').css("display", "none");
        baddata = false
        });
        
    $('#closesave').on("click", function() {
        $('#songs-saved').css("display", "none");
        });

    $('#accordion').on("click", '.header .songtitleartist strong', function() { 
        hideTitleArtist($(this).parents('.header'));   
        });
        
    $('#accordion').on("click", '.header .songentry form', function(e) {
        if ((e.target === this) && (!$(this).parents(".header").hasClass("newsong"))) {
            showTitleArtist($(this).parents('.header'));
            }
        });
    
    $('#accordion').on("click", ".header .songentry form .cancelchange", function() {
        $(this).siblings(".titleentry").val("")
        $(this).siblings(".artistentry").val("")
        if (!$(this).parents(".header").hasClass("newsong")) {showTitleArtist($(this).parents(".header"))}
        $(this).parents(".header").next(".panel").css("display", "none")        
        $(this).parents(".header").next(".panel").find("selector").css("display", "none")
        });

    $('#accordion').on("click", ".header .songentry form .searchbutton", function() {
        $(this).parents(".header").next(".panel").css("display", "block");
        if (num_songs === 0) {
            $('#enter-search').css("display", "none");
            $('#choose-provider').css("display", "block");
            }
        });
    
    $('#accordion').on("click", ".panel .tabset ul .mobiminibutton", function() {
        panel = $(this).parents(".tabset").find($(this).find("span").attr("title"))
        $(this).siblings(".highlight").removeClass("highlight");        
        $(this).addClass("highlight");
        $(this).parents(".tabset").find(".clicked").removeClass("clicked").css("display", "none");
        panel.css("display", "block").addClass("clicked");
        showSelect(panel, $(this));
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
        if (iconSize === "big") {
            h = playerHeightsBig[provider];
            }
        else {
            h = playerHeightsSmall[provider];
            }
        player.children("iframe").css("height", h+"px");
        player.siblings(".selection").css("margin-top", Math.max(0, (h/2)-15)+"px")
        });

    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .cancelchange", function() {
        var headobj = $(this).parents(".panel").prev();       
        headobj.find(".titleentry").val("");
        headobj.find(".artistentry").val("");
        if (!headobj.hasClass("newsong")) {showTitleArtist(headobj)}
        $(this).parents(".tabset").find("ul.highlight").removeClass("highlight");
        $(this).parents(".panel").css("display", "none");        
        $(this).parents(".selector").css("display", "none");
        });

    $("#accordion").on("click", ".panel .tabset .selector .selection .buttons .confirmbutton", function() {
        var panel = $(this).parents(".selector");
        var provider = parseInt(panel.attr("id").slice(-1));
        var songdeets = $.parseJSON(panel.find(".selectmenu").val());
        var songtag = songdeets.url;
        var songtitle = songdeets.title;
        var songartist = songdeets.artist;
        $.post('/get_confirm/', {'songtitle': songtitle, 'songartist': songartist, 'songtag': songtag, 'provider': provider}, function(r) {
            panel.html(r);
            if ($("body").css("width") === "620px") {
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
            if ($("body").css("width") === "620px") {
                panel.find(".buttons").html('<div class="cancelchange"><img src="/static/crossbig.png" alt="N" /></div><div class="confirmbutton"><img src="/static/tickbig.png" alt="Y" /></div>');               
                }
            else {
                panel.find(".buttons").html('<div class="confirmbutton"><img src="/static/ticksmall.png" alt="Y" /></div><div class="cancelchange"><img src="/static/crosssmall.png" alt="N" /></div>');            
                }
            if (panel.children(".noresults").length > 0) {
                panel.css("height", "50px");
                }
            else {
                if (num_songs == 0) {
                    $('#choose-provider').css("display", "none");
                    $('#choose-song').css("display", "block");
                    }
                panel.css("height", "auto");               
                }
            panel.find('.selectmenu').focus();
            });
        }

    $("#accordion").on("click", ".panel .tabset .selector .confirmholder .buttons .confirmbutton", function() {
        var songnum = panelNumber(($(this).parents(".selector").attr("id")));
        if (!checkDeets($(this))) {
            if (num_songs === 0) {
                $('#enter-deets').css("display", "none");
                }
            if (songnum > num_songs) {
                songdeets.push(Array($(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                    $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()));
                $("#"+songnum+"header").removeClass('newsong');
                num_songs += 1;
                if (num_songs < NUMSONGS) {
                    $.post('/new_panel_mob/', {'newsong': num_songs+1}, function(r) {
                        $('#accordion').append(r);
                        doUpdate();
                        });
                    }
                }
            else {
                songdeets[songnum-1] =[$(this).parents(".confirmholder").find(".songtitle").val(), $(this).parents(".confirmholder").find(".songartist").val(),
                    $(this).parents(".confirmholder").find(".songreason").val(), $(this).parents(".confirmholder").find(".songtag").val(), $(this).parents(".confirmholder").find(".songprov").val()];        
                }
            if ((num_songs === NUMSONGS) && (!existing_ten)) {
/*                $("#confirm").removeClass("disabled");
                $("#save").addClass("disabled");        */
                $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id}, function(r) {
                    window.location = "/show_songs_mob/" + facebook_id;        
                    });                     
                }
            else {
                $.post('/save_songs/', {'songlist': JSON.stringify(songdeets), 'topten_id': topten_id, 'facebook_id': facebook_id});                            
                }
            $(this).parents(".panel").css("display", "none");
            updateSongDisplay();
            $(this).parents(".panel").prev(".header").children(".songentry").css("display", "none");
            }
        else {
            $("#bad-data").css("display", "block");
            baddata = true;
            }        
        });

    }

// **************************************************************
function checkDeets(panel) {
    v = panel.parents(".confirmholder").find(".songtitle").val() + panel.parents(".confirmholder").find(".songartist").val() + panel.parents(".confirmholder").find(".songreason").val();
    console.log(v);
    for (i=0; i<BANNED.length; i++) {
        if (v.indexOf(BANNED[i]) > -1) {return true;}
        }
    return false;
    }

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
        }
 
function hideTitleArtist(header) {
    header.children('.songtitleartist').css("display", "none");
    header.children('.songentry').css("display", "inline-block");
        }

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
        
function scloudPlayer(url) {
    if ($("body").css("width") === "620px") {
        w = playerWidthsBig[provider];
        h = playerHeightsBig[provider];                
        }
    else {
        w = playerWidthsSmall[provider];
        h = playerHeightsSmall[provider];                    
        }    
    return $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: w, maxheight: h, auto_play: false, show_comments: false},
        dataType: "json"
        });
    }    
    