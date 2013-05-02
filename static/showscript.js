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
    