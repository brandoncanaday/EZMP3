package com.ezmp3.helper;

import org.jsoup.Jsoup;
import org.jsoup.safety.Whitelist;

public class InputCleaner {
	/**
	 * Grabs all characters in the input string that are not in the Jsoup whitelist
	 * and replaces them with html entities to avoid any security issues.
	 * 
	 * @param s the input string to sanitize, usually html
	 * @return (s != null) ? the sanitized version of the input string : null
	 */
	public static String sanitize(String s) {
		if(s == null) return null;
		return Jsoup.clean(s, Whitelist.basic());
	} // sanitize
} // InputCleaner
