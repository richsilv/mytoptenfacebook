$(function() {
    
    doUpdate();
    doSetup();

});

var playerheights = Array(0, 80, 80, 200);
var NUMSONGS = 3;

// ********************************

function doUpdate() {
    
    $( "#accordion" ).accordion({
        heightStyle: "content",
        collapsible: true,
        active: false
        });
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
        
    $('#accordion').on("accordionactivate", function(e, ui) {
        if (ui.newPanel.length) {
            var panelnum = panelNumber(ui.newHeader.attr("id"));
            var selection = songdeets[panelnum-1][3];
            var provider = parseInt(songdeets[panelnum-1][4]);
            var player = ui.newPanel.find(".player");
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
            player.siblings(".reason").css("margin-top", Math.max(0, (playerheights[provider]/2)-15)+"px")
            }    
        });

    $(".slider").on("click", function() {
        if ($(this).hasClass("closed")) {
            $(this).addClass("open").removeClass("closed");
            $(this).animate({"margin-left": '-420px'});
            $(this).parents(".lefthalf").find(".reasonbox").animate({"padding-right": '420px'});            
            $(this).parents('.lefthalf').next('.playerbox').animate({"margin-left": "-320px"}, function() {
                $(this).css("display", "block");
                });         
            }
        else if($(this).hasClass("open")) {
            $(this).addClass("closed").removeClass("open");
            $(this).parents('.lefthalf').next('.playerbox').css("display", "none");
            $(this).parents(".lefthalf").find(".reasonbox").animate({"padding-right": '100px'});
            $(this).animate({"margin-left": '-110px'});
            $(this).parents('.lefthalf').next('.playerbox').animate({"margin-left": "0"});         
            }
        });

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
        
function scloudPlayer(url) {
    return $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: 290, maxheight: 150, auto_play: true, show_comments: false},
        dataType: "json"
        });
    }    
    