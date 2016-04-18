$(document).ready(function() {

  var player = SC.Widget($('iframe.sc-widget')[0]);
  var pOffset = $('.player').offset();
  var pWidth = $('.player').width();
  var scrub;
  var playlist;
  var tracksPerPage = 12;      // define the number of tracks we want to display per page (see bootstrap's col-xx-x)

  // Handles event : player is ready, then we select the first track to play
  player.bind(SC.Widget.Events.READY, function() {

    console.log("Event handler : player ready");
    // returns an object with metadatas for the first 5 tracks and returns ID's (only) of all of the other tracks contained in the playlist
    player.getSounds(function(tracks) {

      playlist = tracks;

      setInfo();

      player.pause();

      // init playlist list that will be displayed when track-playlist button clicked

      var output = '';

      $.each(playlist, function(i, data) {
        if (data.title) {
          // add a new column with track metadatas
          output += '<div class="col-xs-6 col-md-3"><div class="track"><div class="track-metadata" data-id-track="' + data.id + '"><span class="track-title">' + data.title + '</span><br/>' + data.user.username + '</div>';
        } else {
          // add an empty columns with track id that will be hidden
          output += '<div class="col-xs-6 col-md-3 empty-track"><div class="track"><div class="track-metadata" data-id-track="' + data.id + '"></div>';
        }
        // add play button for this track
        output += '<div class="play-button"><i class="fa fa-play fa-2x" aria-hidden="true"></i></div></div></div>';

      });

      //we add this list of elements to the container
      $("#playlist").append(output);

      // we colorize the big button init player and start scaling animation on hover
      //$("#init-player").addClass("grayscale-out ready-to-play");
      

    }); //getSounds
  }); //bind READY


  // handles event : track is playing
  // Shows the progressbar progression
  // If we are at the begginning of the sound, we setInfos
  player.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
    if (e.relativePosition < 0.003) {
      setInfo();
    }
    $('#progressbar').val(e.relativePosition);
  });

  // handles event when track is finished : unset playing class in playlist li item
  player.bind(SC.Widget.Events.FINISH, function() {
    console.log("Event handler : track %s finished", player.current.id);
    $("div[data-id-track='" + player.current.id + "']").removeClass('playing');

  });

  // handles event : user moves in the progressbar
  $('.player').mousemove(function(e) { //Get position of mouse for scrubbing
    scrub = (e.pageX - pOffset.left);
  });

  // handles event : user clicks in the progressbar. 
  // then we move to the desired position of the track
  $('.player').click(function() { //Use the position to seek when clicked
    $('#progressbar').val(scrub / pWidth);
    var seek = player.duration * (scrub / pWidth);
    player.seekTo(seek);
    console.log("Event handler : user seek position %s in current track", seek);

  });

  // Handles when user requires to play/pause the track. 
  // If we were paused, we play the track in the player and we display the Pause button. 
  // If we were playing, we pause the track in the player and we display the Play button.
  $("#track-play-pause").on('click', function() {
    
    //if player is ready and playlist loaded
    if(playlist) {
      console.log("Event handler : user click play/pause switcher");

      var el = $("#track-play-pause i");
      el.toggleClass("fa-play");
      el.toggleClass("fa-pause");

      player.toggle();
    }

  });

  // Handles when user clicks on the big play button 
  $("#init-player").on('click', function() {

    //if player is ready and playlist loaded
    if(playlist) {

      console.log("Event handler : user click on the big play button");
      $("#play").fadeOut("slow");

      // colorize the page
      $("#wrapper").addClass("grayscale-out");

      // display pause button instead of play button
      var el = $("#track-play-pause i");
      el.toggleClass("fa-play");
      el.toggleClass("fa-pause");

      player.play();
    
    }
  });

  // Handles when user requires next track.
  // If we reached the last track, we keep this one in the player. Else we take the next one
  // If we were paused, we pause the stream. Else we play
  $("#track-next").on('click', function() {

    //if player is ready and playlist loaded
    if(playlist) {

      console.log("Event handler : user requests next track of ", player.current.id);
      player.isPaused(function(paused) {

        // Unset playing class in playlist li item
        $("div[data-id-track='" + player.current.id + "']").removeClass('playing');

        /*if (player.currentSoundIndex =  0) {
            player.skip(player.currentSoundIndex - 1);
            setInfo();
        } else {
            player.skip(player.currentSoundIndex);
        }
        */
        player.next();
        if (paused) {
          player.pause();
          setInfo();
        }
      });
    } // IF playlist
  });

  // Handles when user requires a specific track found in playlist.
  // If we were paused, we pause the stream. Else we play
  $("#playlist").on('click', '.play-button', function() {
    console.log("Event handler : user requests track in playlist");

    var el = $(this).parent().parent();
    console.log(el.index());

    player.isPaused(function(paused) {

      // Unset playing class in playlist item
      $("div[data-id-track='" + player.current.id + "']").parent().removeClass('playing');

      player.skip(el.index());

      if (paused) {
        player.pause();
        setInfo();
      }
    });
  });

  // Handles when user changes sound volume 
  $("#volumeslider").on('change', function() {
    var el = $(this);
    console.log("Event handler : user require new volume at : ", el.val());
    player.setVolume(el.val());
  });

  // Handles when user want to display or hide playlist. 
  // If there is only 5 tracks loaded, get automatically next tracks in playlist for display a longer playlist
  $("#track-playlist").on('click', function() {

    //if player is ready and playlist loaded
    if(playlist) {

      // get the first track in the list that has no metadata (ie only an ID)
      firstTrackToLoad = $(".empty-track").first();

      // if a track to load exists
      if (firstTrackToLoad.length) {

        // number of tracks to load
        var tracksToLoad = tracksPerPage - firstTrackToLoad.index() % tracksPerPage;

        // If we are not a multiple of tracksPerPage, we complete the list by adding missing title
        if (tracksToLoad != tracksPerPage) {

          //alert(tracksToLoad);

          // initialize tracksIds string with the ID of the first track on which we want to retrieve metadatas.
          var tracksIds = firstTrackToLoad.children(".track").children(".track-metadata").data("id-track");

          // decrement TracksToLoad as we already loaded one
          tracksToLoad --;

          // get the next track ids if exists
          for (var i = 0; i < tracksToLoad; i++) {
            nextTrackToLoadId = firstTrackToLoad.nextAll().slice(i).children(".track").children(".track-metadata").data("id-track");

            // if exists
            if (nextTrackToLoadId) {
              tracksIds += '%2C'; // add separator for http request string
              tracksIds += nextTrackToLoadId; // selects the next track ID
            }
          }

          console.log('Event handler : user require next tracks list : ', tracksIds);

          socket.emit('nextTracks', tracksIds);

        } // IF tracksToLoad != tracksPerPage

      } // IF firstTrackToLoad.length

      console.log("Event handler : user toggle track-playlist button visibility");

      $('#playlist').toggle();
      $('#content').toggleClass('transparent');
      $('#read').hide();      
      $("#quote-read-unread").removeClass('active');

    } // IF playlist
  });

  // handles when user requests next tracks list by scrolling down in the playlist
  $("#content").scroll(function() {

    //for debug only 
    /* 
      console.log("$(#content).scrollTop()");
      console.log($("#content").scrollTop());

      console.log("$(#content).height()");
      console.log($("#content").height());

      console.log("$(#content).scrollTop() + $(#content).height()");
      console.log($("#content").scrollTop() + $("#content").height());


      console.log("$(#playlist).height()");
      console.log($("#playlist").height());

      console.log("$(#content-container).height()");
      console.log($("#content-container").height());
  
      if ($("#content").scrollTop() + $("#content").height() == $("#content-container").height()) {
        alert("match");
      }
    */

    // if we reacheed the bottom of the list by scrolling
    if ($("#content").scrollTop() + $("#content").height() == $("#content-container").height()) {

      // number of tracks to load
      var tracksToLoad = tracksPerPage;

      //$("#playlist").append("<li>loading</li>");

      // get the first track in the list that has no metadata (ie only an ID)
      firstTrackToLoad = $(".empty-track").first();

      // if exists
      if (firstTrackToLoad.length) {

        // initialize tracksIds string with the ID of the first track on which we want to retrieve metadatas.
        var tracksIds = firstTrackToLoad.children(".track").children(".track-metadata").data("id-track");

        // decrement TracksToLoad as we already loaded one
        tracksToLoad --;

        // get the x next track ids if exists
        for (var i = 0; i < tracksToLoad; i++) {
          nextTrackToLoadId = firstTrackToLoad.nextAll().slice(i).children(".track").children(".track-metadata").data("id-track");

          // if exists
          if (nextTrackToLoadId) {
            tracksIds += '%2C'; // add separator for http request string
            tracksIds += nextTrackToLoadId; // selects the next track ID
          }
        }

        console.log('Event handler : user require next tracks list : ', tracksIds);

        socket.emit('nextTracks', tracksIds);

      } // IF firstTrackToLoad.length

    }
  });

  // Handles when server returns the next tracks list required by user by scrolling in the playlist
  socket.on('displayNewTracks', function(nextTracks) {
    console.log('Event handler : server returned next tracks list', nextTracks);
    $.each(nextTracks, function(i, data) {

      var track = $(".track-metadata[data-id-track='" + data.id + "']");
      track.html('<span class="track-title">' + data.title + '</span><br/>' + data.artist);
      track.parent().parent().removeClass('empty-track');

    });

  });


  // display metadata from current track
  function setInfo() {
    player.getCurrentSound(function(track) {

      //$('.info').html(artist + ' - ' + info);
      $('#progresslabel').html(track.title + ' - ' + track.user.username);

      $("div[data-id-track='" + track.id + "']").parent().addClass('playing');

      player.current = track;

      console.log('Event Handler : now playing track ', player.current.id);
    });

    player.getDuration(function(value) {
      player.duration = value;
    });

  } //setInfo

  // allows playlist to drag
/*
  function drag_start(event) {
    var style = window.getComputedStyle(event.target, null);
    event.dataTransfer.setData("text/plain", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY));
  }

  function drag_over(event) {
    event.preventDefault();
    return false;
  }

  function drop(event) {
    var offset = event.dataTransfer.getData("text/plain").split(',');
    var dm = document.getElementById('playlist-container');
    dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
    dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
    event.preventDefault();
    return false;
  }
  var playlistContainer = document.getElementById('playlist-container');
  playlistContainer.addEventListener('dragstart', drag_start, false);
  document.body.addEventListener('dragover', drag_over, false);
  document.body.addEventListener('drop', drop, false);*/


});