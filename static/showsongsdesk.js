// Functions to execute on page load
$(function() {

    // Facilitate Facebook integration
    window.fbAsyncInit = function() {
        FB.Canvas.setAutoGrow();
        };
    
    // Setup accordion and necessary variables
    $( "#accordion" ).accordion({
        heightStyle: "content",
        collapsible: true,
        active: false
        });
    
    var selection = Array();
    var provider = Array();
    var player = Array();
    var promise = Array();
    
    // Setup tabs and load in players using Python backend (AJAX)
    for (panelnum=1; panelnum<songdeets.length+1; panelnum++) {
        selection[panelnum] = songdeets[panelnum-1][3];
        provider[panelnum] = parseInt(songdeets[panelnum-1][4]);
        player[panelnum] = $("#"+panelnum+"panel").find(".player");
        if (provider[panelnum] === 2) {
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

    // Setup bottom bar and buttons thereon
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

    // Slider - change appearance on mouse-over and add sliding logic
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
    
    // Close slider and show player automatically if there is no comment attached to a given song
    for (panelnum=1; panelnum<songdeets.length+1; panelnum++) {
        if (songdeets[panelnum-1][2] === "") { $("#"+panelnum+"panel").find(".slider").click(); }
        }
});