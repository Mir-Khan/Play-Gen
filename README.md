# A Web App that uses Spotify's Web API
This app creates playlists en-masse in Spotify instead of one by one in the playlist. It accomplishes this by using the context of the playlist being modified or the listening history of the user using the app.

# Changelog
* v1.0 
    * Made a landing page with a log-in button, made the actual forms for playlist creation.
    * And also made a how to page to explain some notes when making a playlist using the tool.
* v1.1 
    * Fixed the server-side code to include less unneeded code. 
    * Also fixed the fact that quantities of more than 100 songs weren't being accepted by the form. The tool now works as advertised!
* v1.2
    * Added a user-input page where users can add their own fields for the Spotify recommendation API to create playlists with
    * The index page is no longer where the forms are located. They have been instead moved to their own pages
    * Cleaned up some of the server side code and separated most of the app functions into its own separate file
    * Separated and minified the css so a page doesn't have to load every other page's css. Should've been done earlier but the page was just two pages at that point
    * Added a 404 page
    * With the addition of the new user-input page, the how-to page has been removed and replaced with just some brief notes on the page.
    * There is also a new page which allows a user to choose which tool they'd like to use immediately after logging into Spotify
    * Navbar and footer have been updated
* v1.2.1
    * Fixed bug with the user-input page where only the first 20 results were being searched for a track. This would've lead to problems when searching for more obscure artists with very common track names.
    * Fixed bug with the rec page where incorrect variable names broke the form.
    * Added an error message to the user-input page, might make it better later on