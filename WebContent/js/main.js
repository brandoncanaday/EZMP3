var playlist = [];
$(document).ready(function() {
	//ON PAGE LOAD
	initCookies();
	initWatchLater();
	
	//COOKIE STUFF
	//if necessary cookies do not exist yet for client, create them
	function initCookies() {
	  if(!Cookies.get('playlist')) {
		  Cookies.set('playlist', JSON.stringify('[]'), { expires: 28 });
	  } else {
		  // sets global playlist[] to the user's cookie value
		  playlist = JSON.parse(Cookies.get('playlist')).slice();
	  } // if/else
	} // initCookies

	//updates playlist cookie with newest value of global playlist[]. also resets expiration timer
	function updateCookie() {
	    Cookies.set('playlist', JSON.stringify(playlist), { expires: 28 });
	} // updateCookie

	//GET YOUTUBE VIDEOS STUFF
	//gets videos from Youtube Data API and displays them
	var c_row;
	function getStreams(_keyword, _page, overwrite) {
		$.ajax({
	        type: "POST",
	        url: "YoutubeServlet",
	        data: {f_keyword: _keyword, page: _page},
	        success: function(data) {
	        	// skips everything if user has deleted all input since last Ajax call
	        	if(!$('#f_keyword').val()) return null;
	        	// modifies the global 'page' variable for use in infinite scroll
	        	page = data.nextPageToken;
	            // populate .stream-container with .stream-row's/.stream's
	            var sc = $('.stream-container');
	            if(overwrite) { // overwrites html instead of appending
	            	sc.empty(); 
	            	c_row = null; 
	            } else { // remove stream-spacer if present
	            	if(c_row != null && c_row.children('.stream-spacer')) { c_row.children('.stream-spacer').remove(); } // if
	            } // if/else
	            // begin dynamically creating stream html from servlet JSON response
	            var str, thumb, head, info;
	            var didFindStreams = false;
	            var STREAMS_PER_ROW = 3;
	            $.each(data.videos, function(i, stream) {
	            	didFindStreams = true;
	            	// every STREAMS_PER_ROW streams added, make a new stream row
	            	if(c_row == null || c_row.children().length == STREAMS_PER_ROW) { 
	            		sc.append("<div class='stream-row'></div>"); 
	            		c_row = $('.stream-row:last'); 
	            	} // if
	            	c_row.append("<div class='stream' " 	+
	            					"data-id='"        		+ stream.id  			+ "' " +
							 		"data-url='"        	+ stream.url  			+ "' " +
							 		"data-title='"      	+ stream.title 			+ "' " +
							 		"data-thumbnail='"		+ stream.thumbnail		+ "' " +
							 		"data-channel-name='"	+ stream.channel_name	+ "' " +
							 		"data-channel-url='"	+ stream.channel_url	+ "' " +
							    "</div>");
		        	str = c_row.children(':last');
		        	str.append("<div class='thumbnail'></div>");
		            	thumb = str.children('.thumbnail');
		            	thumb.append("<div class='heading'></div>");
		            	thumb.append("<div class='info'></div>");
			            	head = thumb.children('.heading');
			            	head.css('backgroundImage','url("'+stream.thumbnail+'")');
			            	if(searchPlaylistForStream(stream.id) >= 0) {
			            		// append a checkmark icon for watch-later button
			            		head.append("<span class='watch-later added' data-tooltip='Added'>" +
		            							"<i class='fa fa-check' aria-hidden='true'></i>" +
		            						"</span>");
			            	} else {
			            		// append a history icon for watch-later button
			            		head.append("<span class='watch-later' data-tooltip='Watch Later'>" +
		            							"<i class='fa fa-history' aria-hidden='true'></i>" +
		            						"</span>");
			            	} // if
			            	info = thumb.children('.info');
			            	info.append("<div class='game'><span>"+stream.title+"</span></div>");
			            	info.append("<div class='ch_name'>"+
			            					"<a href='"+stream.channel_url+"' " +
			            				    	"target='_blank' " +
			            				    	"rel='noopener'>" + stream.channel_name +
			            					"</a>" +
			            				"</div>");
			            	/*
			            	info.append("<div class='viewers'>"+
			            					"<span>"+stream.viewers.toLocaleString()+"</span>" +
			            				"</div>");
			            	*/
	            }); // end $.each 
	            if(!didFindStreams && !sc.html()) { 
	            	sc.append("<div class='no-results'><span>Woops! No matches were found for your search.</span></div>"); 
	            } else if(c_row.children().length != STREAMS_PER_ROW) {
	            	for(var i = c_row.children().length; i < STREAMS_PER_ROW; i++) {
	            		c_row.append("<div class='stream-spacer'></div>");
	            	} // for
	            } // if
	        },
	        error: function(xhr, error, msg) { // there was some problem in accessing the StreamServlet
	            console.log(msg);
	        }
	    }); // end $.ajax
	} // getStreams

	//INFINITE SCROLL STUFF
	//calls getStreams() on scroll condition. appends new streams instead of overwriting
	var page = "";
	var isWorking = false;
	$('.stream-container').scroll(function() {
	    var $this = $(this);
	    var from_inner_top = $this.scrollTop();
	    var innerheight = $this[0].scrollHeight;
	    var initialheight = $this.height();
	    if((from_inner_top/(innerheight-initialheight)) > .999) {
	    	// prevents quick, successive calls to API by someone who keeps repeatedly hitting bottom of scroll bar
	    	if(!isWorking) {
	    		isWorking = true;
	    		getStreams($('#f_keyword').val(), page, false);
	    		setTimeout(function(){ isWorking=0; },1500);
	    	} // if
	    } // if
	});

	//SEARCH STUFF
	//calls getStreams() after done typing. new videos reflect search input
	var typingTimer; // timer identifier
	$('#search').on('input', function() {
		var val = $('#f_keyword').val();
		if(val) {
			clearTimeout(typingTimer); // reset the timer
			typingTimer = setTimeout(function() {
				getStreams(val, "", true);
			}, 800); // waits 0.8s after typing is over to update streams
		} else {
			// immediately clear all content. 
			// if previous ajax call completes in background, 
			// it will immediately return before appending content
			$('.stream-container').empty();
		} // if/else
	});

	//WATCH LATER TAB STUFF
	//called on page load. initializes watch later tab and playlist[] from cookie('playlist')
	function initWatchLater() {
		var $ul = $('.history-tab ul');
		if(!playlist.length) {
			$ul.append("<li class='no-results'><span>No videos for you to download later :(</span></li>"); 
		} else {
			$.each(playlist, function(i,stream) {
				appendToWatchLaterTab($ul,stream);
			}); // end $.each
		} // if/else
	} // initWatchLater

	//checks if a certain video is in watch later playlist already
	function searchPlaylistForStream(videoId) {
		//check if already added to playlist[]
		var index = -1;
		$.each(playlist, function(i, video) {
			if(video.id == videoId) { index = i; return false; } // if
		});
		return index;
	} // searchPlaylistForStream

	//converts 'data-' attr info into JSON obj containing necessary stream info
	function jsonFromStreamMeta($stream) {
		var json = {
			id: $stream.attr('data-id'),
			url: $stream.attr('data-url'),
			title: $stream.attr('data-title'),
			thumbnail: $stream.attr('data-thumbnail'),
			channel_name: $stream.attr('data-channel-name'),
			channel_url: $stream.attr('data-channel-url'),
		};
		return json;
	} // jsonFromStreamMeta

	//appends stream html to watch later tab interface
	function appendToWatchLaterTab($ul,stream) {
		$ul.append("<li class='thumb-tab stream' data-id='"+stream.id+"' data-url='"+stream.url+"' data-title='"+stream.title+"' data-channel-name='"+stream.channel_name+"'>"+
						"<i class='remove fa fa-close'></i>"+
						"<span class='download' data-tooltip='Download'><i class='fa fa-download'></i></span>"+
						"<div class='thumb-img'></div>"+
						"<p>"+
							"<span class='thumb-title'>"+stream.title+"</span>"+
							"<a class='thumb-channel' href='"+stream.channel_url+"' target='_blank' rel='noopener'>"+stream.channel_name+"</span>"+
						"</p>"+
				   "</li>"); 
		$("[data-id="+stream.id+"] .thumb-img").css('backgroundImage', 'url("'+stream.thumbnail+'")');
	} // appendToWatchLaterTab

	//remove stream html from watch later tab interface
	function removeFromWatchLaterTab($ul,stream) {
		$ul.children('[data-id='+stream.id+']').remove(); // from watch later tab
		if(!$ul.children().length) {
			// add .no-results msg if final stream removed
			$ul.append("<li class='no-results'><span>No videos for you to download later :(</span></li>");
		} // if
	} // removeFromWatchLaterTab

	//add/remove from watch later via thumbnail watch later button
	$(document).on('click', '.watch-later', function(e) { // has to be (document).on() for dynamically created elements
		e.stopPropagation();
		var $this = $(this);
		var $ul = $('.history-tab ul');
		var $stream = $(this).closest('.stream');
		var stream_json = jsonFromStreamMeta($stream);
		var stream_index = searchPlaylistForStream(stream_json.id);
		if(stream_index < 0) {
			//add it
			if($ul.children('.no-results').length) $ul.empty(); // remove .no-results msg if its there
			playlist.push(stream_json); // store in array for easy processing
			//dynamically create new watch later tab entry
			appendToWatchLaterTab($ul,stream_json); // store in tab for user viewing
			updateCookie(); // updates playlist cookie with new playlist[] value
			//update watch later icon to checkmark, and tooltip to 'Added'
			$this.html("<i class='fa fa-check' aria-hidden='true'></i>");
			$this.attr('data-tooltip', 'Added');
			$this.addClass('added');
		} else {
			//remove it
			playlist.splice(stream_index,1); // from playlist[]
			removeFromWatchLaterTab($ul,stream_json); // from watch later tab
			updateCookie(); // updates playlist cookie with new playlist[] value
			$this.html("<i class='fa fa-history' aria-hidden='true'></i>");
			$this.attr('data-tooltip', 'Watch Later');
			$this.removeClass('added');
		} // if/else
	});

	//remove from watch later via thumb-tab remove button
	$(document).on('click', '.thumb-tab .remove', function() {
		var $ul = $('.history-tab ul');
		var $stream = $(this).closest('.stream');
		var stream_json = jsonFromStreamMeta($stream);
		var stream_index = searchPlaylistForStream(stream_json.id);
		var corresponding_thumbnail = $('[data-id='+stream_json.id+']');
		playlist.splice(stream_index,1); // from playlist[]
		removeFromWatchLaterTab($ul,stream_json); // from watch later tab
		updateCookie(); // updates playlist cookie with new playlist[] value
		// if stream thumbnail is located in stream container, change watch later icon back to default
		if(corresponding_thumbnail) {
			corresponding_thumbnail.find('.watch-later').html("<i class='fa fa-history' aria-hidden='true'></i>");
			corresponding_thumbnail.find('.watch-later').attr('data-tooltip', 'Watch Later');
			corresponding_thumbnail.find('.watch-later').removeClass('added');
		} // if
	});

	//pulls out watch later tab
	var out = false;
	$('#history').click(function() {
		var $right = $('.history-tab');
		if(!out) {
			$(this).children('i').css('transform', 'rotate(-360deg)');
			$right.css({ 'width': '30rem', 'display': 'block' });
			out = true;
		} else {
			$(this).children('i').css('transform', 'rotate(0deg)');
			$right.css({ 'width': 0, 'display': 'none' });
			out = false;
		} // if/else
	});

	//MODAL STUFF
	//opens dynamically-created Youtube video player on thumbnail click
	$(document).on('click', '.thumbnail .heading, .thumbnail .game, .thumb-tab .thumb-title, .thumb-tab .thumb-img', function() { // has to be (document).on() for dynamically created elements
		var $stream = $(this).closest('.stream');
	    var stream_data = jsonFromStreamMeta($stream);
	    // check if necessary meta-data was recovered
	    if(stream_data) {
	    	// prepare dynamic stream player content
	    	$('.modal-content').append("<iframe id='player' class='player' type='text/html' src='' height='' width='' frameborder='0' allowfullscreen></iframe>");
	    	var $player = $('.player');
	    	$player.attr('src',"https://www.youtube.com/embed/"+stream_data.id+"?autoplay=1");
	    	$player.attr('height',$player.height());
	    	$player.attr('width',$player.width());
			// appear modal blur
		    $('.stream-container').css('overflow', 'hidden');
		    $('.modal').css('visibility', 'visible');
		    $('.modal').css('background', 'rgba(30,30,30,.7)'); 
		    // appear modal content
		    setTimeout(function() {
		        $('.modal .modal-content').css('visibility', 'visible');
		        $('.modal .modal-content').css('opacity', 1);
		    }, 200);
	    } // if
	});
	
	//opens dynamically-created download form on download icon click
	$(document).on('click', '.thumb-tab .download', function() { // has to be (document).on() for dynamically created elements
		var $stream = $(this).closest('.stream');
	    var stream_data = jsonFromStreamMeta($stream);
	    // check if necessary meta-data was recovered
	    if(stream_data) {
	    	// prepare dynamic stream player content
	    	$('.modal-content').append('<form id="download-form" class="cf">' 																	 					   							+
	    							   	'<h1>EZMP3 Custom Download</h1>'	  																	 					   							+
	    							   	'<div class="whole cf">'																				 					   							+
	    							   	'<input type="text" id="download-title" placeholder="Title (default: '+htmlEntities(stream_data.title,true)+')">'								   		+
	    							   	'</div>'																								 					   							+
	    							   	'<div class="half left cf">'																			 					   							+
	    							   	'<input type="text" id="download-startpoint" placeholder="Startpoint (default: 0)" pattern="^\d*$" title="Enter a number > 0">'							+
	    							   	'</div>'																								 					   							+
	    							   	'<div class="half right cf">'												 							 					   							+
	    							   	'<input type="text" id="download-endpoint" placeholder="Endpoint (default: max)" pattern="^\d*$" title="Enter a number > 0">'  							+
	    							   	'</div>'																								 					   							+
	    							   	'<input id="download-button" class="whole cf" type="button" value="Customize MP3" data-url="'+stream_data.url+'" data-title="'+htmlEntities(stream_data.title,true)+'"/>' +
	    							   	'</form>');
			// appear modal blur
		    $('.stream-container').css('overflow', 'hidden');
		    $('.modal').css('visibility', 'visible');
		    $('.modal').css('background', 'rgba(30,30,30,.7)'); 
		    // appear modal content
		    setTimeout(function() {
		    	$('.modal .modal-content').css({ width: '550px', height: '400px' });
		        $('.modal .modal-content').css('visibility', 'visible');
		        $('.modal .modal-content').css('opacity', 1);
		    }, 200);
	    } // if
	});

	//closes stream player/download form modal on 'X' click
	$('.modal .close').click(function() { 
	    // disappear modal content
	    $('.modal .modal-content').css('opacity', 0);
	    $('.modal .modal-content').css('visibility', 'hidden');
	    setTimeout(function() {
	        // disappear the modal blur
	        $('.modal').css('background', 'rgba(105,105,105,0)');
	        $('.modal').css('visibility', 'hidden');
	        $('.modal .modal-content').css({ width: '900px', height: '550px' });
	        $('.player').remove(); $('#download-form').remove();
	        $('.stream-container').css('overflow', 'scroll');
	    }, 200);
	});
	
	//DOWNLOAD MP3 STUFF
	//sends ajax request to youtubemp3 API on customize button click, replaces with dynamically-created <a> tag
	$(document).on('click', '#download-button', function() {
		// builds GET url from API base and form params
		var API_REQUEST = "http://www.youtubeinmp3.com/fetch/?format=JSON";
		var $download = $(this);
		var video = $download.attr('data-url');
		var title = $('#download-title').val() || $download.attr('data-title');
		var start = $('#download-startpoint').val() || "";
		var end = $('#download-endpoint').val() || "";
		API_REQUEST += ("&video=" + video);
		API_REQUEST += ("&title=" + encodeURIComponent(title));
		if(start) API_REQUEST += ("&start=" + start);
		if(end) API_REQUEST += ("&end=" + end);
		console.log(API_REQUEST) // DEBUG ONLY
		// makes parameterized api call with data from custom download form
		$.ajax({
			type: 'GET',
			url: API_REQUEST,
			success: function(data) {
				var link = JSON.parse(data).link;
				$('#download-button').replaceWith('<a id="final-button" class="whole cf" href="'+link+'"><i class="fa fa-download">Download</a>');
//				// sends download link obtained from initial parameterized request to servlet to avoid CORS errors
//				$.ajax({
//					type: 'POST',
//					url: 'YoutubeServlet',
//					data: { mp3link: link },
//					success: function(data) {
//						// makes call to final mp3 url obtained from html parsing
//						$.ajax({ 
//							type: 'GET',
//							url: data.finalLink,
//							success: function(data) {
//								console.log('download was a success!');
//							},
//							error: function(xhr, error, msg) {
//								console.log('msg: '+msg)
//							}
//						});
//					},
//					error: function(xhr, error, msg) {
//						console.log('msg: '+msg);
//					}
//				});
			},
			error: function(xhr, error, msg) {
				console.log('msg: '+msg);
			}
		});
	});
	
	//when #final-button is clicked, the download commences with the customized url from API as the href
	$(document).on('mouseup', '#final-button', function() {
		// disappear modal content
	    $('.modal .modal-content').css('opacity', 0);
	    $('.modal .modal-content').css('visibility', 'hidden');
	    setTimeout(function() {
	        // disappear the modal blur
	        $('.modal').css('background', 'rgba(105,105,105,0)');
	        $('.modal').css('visibility', 'hidden');
	        $('.modal .modal-content').css({ width: '900px', height: '550px' });
	        $('.player').remove(); $('#download-form').remove();
	        $('.stream-container').css('overflow', 'scroll');
	    }, 200);
	    return true;
	});
	
	//RIPPLE EFFECT STUFF
	//creates js ripples on background image
	$('body').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.05 });

	// LAZY LOAD STUFF
	//allows images to lazy load rather than hold up DOM
	$('img').unveil();
	
	//HELPER FUNCTIONS
	//encodes html entities in strings
	function htmlEntities(str, encode) {
		if(encode) {
			// encode
			return String(str).replace(/&/g, '&amp;')
							  .replace(/</g, '&lt;')
							  .replace(/>/g, '&gt;')
							  .replace(/"/g, '&quot;')
							  .replace(/'/g, '&apos;');
		} else {
			// decode
			return String(str).replace(/&amp;/g, '&')
							  .replace(/&lt;/g, '<')
							  .replace(/&gt;/g, '>')
							  .replace(/&quot;/g, '"')
							  .replace(/&apos;/g,"'");
		} // if/else
	} // htmlEntities
}); 