package com.ezmp3.helper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

public class MyHTTP {
	/**
	 * This method is meant as a helper function to assist in making a GET request from 
	 * a Java servlet.
	 * 
	 * @param url the url to which the GET request will be made
	 * @param headers the HTTP request headers that need to be set
	 * @param query_string the necessary query-string parameters/values
	 * @return the JSON response from Twitch in JSONObject form
	 */
	public static JSONObject GET(String url, Map<String,String> headers, String query_string) {
		URL obj;
		HttpURLConnection con;
		JSONObject json = null;
		try {
			obj = new URL(url + query_string);
			con = (HttpURLConnection) obj.openConnection();
			// optional default is GET
			con.setRequestMethod("GET");
			//add request headers
			if(headers != null) {
				for(Map.Entry<String, String> header : headers.entrySet()) {
					con.setRequestProperty(header.getKey(), header.getValue());
				} // for
			} // if
			// read in response
			BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			StringBuffer response = new StringBuffer();
			String inputLine;
			while((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			} // while
			in.close();
			//store json
			json = new JSONObject(response.toString());
		} catch (MalformedURLException e) {
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (JSONException e) {
			e.printStackTrace();
		} // try/catch
		return json;
	} // GET
	
	/* www.youtubeinmp3.com API currently does not allow the customization 
	 * they say they allow for cross-origin applications, so this code, and
	 * code in main.js called on #download icon click, have been replaced by 
	 * a simple direct-link <a> tag provided by them as well which does not 
	 * allow for customization of mp3 file prior to download. OH WELL...
	 */
	
//	/**
//	 * This method is meant as a helper function to assist in making a GET request from 
//	 * a Java servlet, specifically to retrieve an mp3 file.
//	 * 
//	 * @param url the 'friendly' url of the mp3 to which the GET request will be made
//	 * @return json object containing the url and filename of the mp3 to be downloaded
//	 */
//	public static JSONObject GETMP3(String link) {
//		JSONObject meta = new JSONObject();
//		String location = link;
//		String content_header = "";
//		HttpURLConnection connection = null;
//		while(true) {
//			try {
//				URL url = new URL(location);
//				connection = (HttpURLConnection) url.openConnection();
//			    connection.setInstanceFollowRedirects(false);
//			    String redirectLocation = connection.getHeaderField("Location");
//			    if(redirectLocation == null) break;
//			    location = "http:"+redirectLocation;
//		      	System.out.println("location: "+location); // DEBUG ONLY
//			} catch (MalformedURLException e) {
//				e.printStackTrace();
//			} catch (IOException e) {
//				e.printStackTrace();
//			} // try/catch
//		} // while
//		content_header = connection.getHeaderField("Content-Disposition");
//		System.out.println("Content-Disposition: "+content_header); // DEBUG ONLY
//		try {
//			meta.put("url", location);
//			meta.put("header", content_header);
//		} catch (JSONException e) {
//			e.printStackTrace();
//		} // try/catch
//		return meta;
//	} // GETMP3
} // MyHTTP
