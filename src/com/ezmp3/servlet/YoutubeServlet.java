package com.ezmp3.servlet;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.ezmp3.helper.InputCleaner;
import com.ezmp3.helper.MyHTTP;

/**
 * Servlet implementation class YoutubeServlet
 */
@WebServlet("/YoutubeServlet")
public class YoutubeServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final String API_BASE = "https://www.googleapis.com/youtube/v3/search"+ // endpoint
										   "?key=AIzaSyDjzx5Dj2J1SMuUWN8zZDuMXjrlrRHzR8o"+ // api key
										   "&type=video"+								   // filter
										   "&part=snippet"+			   					   // response sections
										   "&maxResults=18";							   // # of videos
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public YoutubeServlet() {
        super();
    } // Constructor

	/**
	 * @see Servlet#init(ServletConfig)
	 */
	public void init(ServletConfig config) throws ServletException {
		
	} // init

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// use this to return JSON to ajax
		PrintWriter out = getMyWriter(response);
		response.setContentType("application/json");
		
		// passed here in ajax request from getStreams
		String f_keyword, page; 
		// passed here in ajax request from download button
		String mp3link; 
		
		// checks to see if everything we need has been set correctly
		if((f_keyword = InputCleaner.sanitize(request.getParameter("f_keyword"))) != null && 
		   (page 	  = InputCleaner.sanitize(request.getParameter("page"))) 	  != null) {
			
			// prepares the full URL for the API call
			String q = ""; // search string
			String pageToken = page; // nextPageToken from last api response
			if(!f_keyword.isEmpty()) { 
				q = "&q="+URLEncoder.encode(f_keyword, "UTF-8"); 
			} // if
			if(!pageToken.isEmpty()) {
				pageToken = "&pageToken="+pageToken;
			} // if
			
			// prepares all request headers for the API call
			Map<String,String> header_map = new HashMap<String,String>();
			header_map.put("Accept", "application/json");
			
			// makes the SYNCHRONOUS call to Youtube Data API
			try {
				// full Youtube Data API JSON response
				JSONObject youtube_response = MyHTTP.GET(API_BASE, header_map, q+pageToken);
				// setup our own, smaller JSON to return to ajax
		    	JSONObject my_response = new JSONObject();
		    	// grabs the offset for use in infinite scroll
		    	my_response.put("nextPageToken", youtube_response.getString("nextPageToken"));
		    	// grabs total results for use in UI somewhere
		    	my_response.put("totalResults", youtube_response.getJSONObject("pageInfo").getInt("totalResults"));
		    	try { 
		    		// try to grab JSON array of videos from Youtube response
		    		JSONArray youtube_items = youtube_response.getJSONArray("items"); // gets JSON array of videos from Youtube response 
		    		// creates custom JSON array of videos containing only the info we need for our application
		    		JSONArray my_items = new JSONArray();
	    			for(int i = 0, size = youtube_items.length(); i < size; i++) {
	    				JSONObject item = youtube_items.getJSONObject(i); // gets i'th stream from Twitch response
	    				// pull relevant info from stream obj and store as JSON obj
    					JSONObject vid = new JSONObject();
    					vid.put("id", item.getJSONObject("id").getString("videoId"));
    					vid.put("url", "https://www.youtube.com/watch?v="+vid.getString("id"));
    					vid.put("title", item.getJSONObject("snippet").getString("title"));
    					vid.put("thumbnail", item.getJSONObject("snippet").getJSONObject("thumbnails").getJSONObject("high").getString("url"));
    					vid.put("channel_name", item.getJSONObject("snippet").getString("channelTitle"));
    					vid.put("channel_url", "https://www.youtube.com/user/"+vid.getString("channel_name")); 
    					my_items.put(vid);
	    			} // for
	    			my_response.put("videos", my_items); // now contains 2 strings and a JSON array
		    	} catch(JSONException e) { 
		    		e.printStackTrace();
		    	} // try/catch
		    	
		    	// try to send back the relevant JSON we created from the Youtube video data
		    	// this will then be transformed into HTML we can insert into our stream container
		    	out.print(my_response);
			} catch (NumberFormatException e) {
				e.printStackTrace();
			} catch (Exception e) {
				System.out.println("Something went wrong with MyHTTP.GET()");
				e.printStackTrace();
			} // try/catch
		} else if((mp3link = InputCleaner.sanitize(request.getParameter("mp3link"))) != null) {
			
			/* www.youtubeinmp3.com API currently does not allow the customization 
			 * they say they allow for cross-origin applications, so this code, and
			 * code in main.js called on #download icon click, have been replaced by 
			 * a simple direct-link <a> tag provided by them as well which does not 
			 * allow for customization of mp3 file prior to download. OH WELL...
			 */
			
//			JSONObject my_response = new JSONObject();
//			try {
//				JSONObject mp3meta = MyHTTP.GETMP3(mp3link);
//				String mp3url = mp3meta.getString("url");
//				String content_header = mp3meta.getString("header");
//				// try to download mp3 to client
//			    InputStream is = null;
//			    OutputStream os = null;
//			    try{
//			        is = new URL(mp3url).openStream();
//			        response.setContentType("audio/mpeg");
//			        response.addHeader("Content-Disposition", content_header);
//			      	String where_to_download = System.getProperty("user.home")+"/Downloads/"+
//			      							   content_header.substring(content_header.lastIndexOf("=") + 1)
//			      							   .replaceAll("^\"|\"$", "").replaceAll("/ /", "\\ ");
//			      	os = new FileOutputStream(new File(where_to_download));
//			      	byte[] buffer = new byte[4096];
//			      	int len;
//			      	while ((len = is.read(buffer)) > 0) {
//			      		os.write(buffer, 0, len);
//			      	} // while
//				    if(is != null) is.close();
//					if(os != null) os.close();
//			    } catch (IOException e) {
//			    	e.printStackTrace();
//			    } // try/catch
//				out.print(my_response);
//			} catch(JSONException e) {
//				e.printStackTrace();
//			} // try/catch
		} else { 
			System.out.println("Something went wrong between ajax and YoutubeServlet. Not all necessary parameters were set.");
		} // if/else
		// close response writer
		if(out != null) out.close();
	} // doGet

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	} // doPost
	
	// --- MISC METHODS --- //
	
	/**
	 * Helper method that encapsulates the try/catch block necessary to grab the PrintWriter
	 * object from the HttpServletResponse object.
	 * 
	 * @param r the response object from which the PrintWriter is grabbed
	 * @return the PrintWriter of r
	 */
	private PrintWriter getMyWriter(HttpServletResponse r) {
		PrintWriter out = null;
		try {
			out = r.getWriter();
		} catch (IOException e) {
			e.printStackTrace();
		} // try/catch
		return out;
	} // getMyWriter

} // YoutubeServlet
