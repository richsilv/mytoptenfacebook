$(function() {
    
    doUpdate();
    doSetup();

});

var playerheights = Array(0, 80, 80, 200);
var playerwidths = Array(0, 250, 290, 290);
var NUMSONGS = 3;

// ********************************

function doUpdate() {
    
    $( "#accordion" ).accordion({
        heightStyle: "content",
        collapsible: true,
        active: false
        });
    
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

    $("#buttonbar").find("button").button();

    $('#edit').on("click", function() {
        console.log("click");
        window.location = "/make_songs/" + facebook_id;        
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
    