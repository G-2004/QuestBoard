Project 3 REFLECTION
4/23/2026
--------------------------
I think that so far the project is going well. I am disatisfied with the current logo and seeking a better name for the project however other than that I believe things are going well. The remainder of this project I believe will focus on more control over cards for the user, cleaner css for the description page, and adding the actual mapping page and javaScript. Some "Technologies" I used in this project are the font-awesome library, bootstrap framework, JSON files, javaScript, HTML, and CSS. I do think I will be challenged to complete the mapping section due to delays caused by my ER visit however I belive at this point that it is completable. I'm having a great deal of fun making this site so far. 

INTENTS
    -fix the freaking nodes highlighting before they are visually reached in questMap.js
    -fix that when dragging over non canvas elements after starting on canvas changes stop visually occuring
    -create ability for quest cards to be removed individually
    -cards should become reorderable
    -cards should have fields editable after creation
    -<i class="fa-solid fa-skull"></i> make replace X in difficulty
    -find a nice font
    -locate all instances of carouselContainerContainer Id and references to it and replace with a better name
    -allow user to scale and translate their image before sending it into html as a card
    -resize sideNav button
    -proceeding form becoming more centered
    -come up with schemas for organizing css files and README
    -increase readability of favicon
    -NOTED ISSUE: highlighting text in the form then dragging mouse out of form before releasing closes form
    -header logo needs to shrink when zooming in to allow other parts to fit on screen.

*PROJECT 3
**3/26/2026
    -yesterday the card creation system for quests was added.
    -Logo was created
    -Centering of Logo was fixed
    -XD was replaced with simply X as stand-in for skulls on difficulty
    -Added a currently useless pixel art switch. (the intent is to allow user to select image-rendering for the art on the quest board)
    -fixed upload preview to reset to default image instead of clearing to no image.
    -began some work on adjusting page to work and look ok at various zoom levels.
    -took code for resetting form and mad it its own function
    
    -made quest button look nice

##############################################################################################################
**4/1/2026
    -Attempted to reduce XSS vulnerability in card creation form. Unsure if successful.
##############################################################################################################
**4/21/2026
    -moved intents section of README to top
    -improved appearance of quest creation form
    -introduced font-awesome library to projects index html page
    -replaced alert with a normal in form warning
    -the pixel art switch was made to work prior to this entry
    -site renamed to adventure atlas. Name is technically taken so still working on title
    -attempted favicon redesign
##############################################################################################################
**4/22/2026
    -added download button
    -added upload button
    -added CSS class creationButtonsContainer and the unused vertCenter CSS class to index.css
    -added questDetails.html page
    -cards are saved to local storage (currently non-deletable in app)
    -added questDetails.js
    -added defaultNav.css because the navBar will re-appear on multiple pages
    -added ability to click on card to open the details page and load all the cards data there
    -removed random secondary index.html
##############################################################################################################
**4/23/2026
    -added ability to add additional images for description page
    -added bootstrap framework
    -added bootstrap carousel
    -removed local storage quest from project
    -replaced local storage with indexed database
##############################################################################################################
*PROJECT 4
**4/24/2026
    -started adding a*
##############################################################################################################
**4/25/2026 - gitUpdate
    -completed adding basic a* pathfinding algorithm
    -added page that let's you test a* with a start and end and highlights all nodes and connections in final/best path to the goal
    -also added script to draw the nodes connections and stuff
    -wrote extensive annotations on a* in questMap.js
    -starting in this entry an entry in readme with '- gitUpdate' indicates I uploaded something to gitHub on that day
    -replaced prior rendering system by (adding panning and zoom)
    -created camera that tells canvas area what to render and where and what size
    -added css to buttons on mapping page
    -canvas now takes up whole screen
    -z index makes things render above canvas
##############################################################################################################
**4/26/2026 - gitUpdate
    -added animation to rendering path
    -to select a path to work out there is now a path mode in path mode you click a start node and an end node
    -user can now add and connect nodes (they are not saved on re-load yet)
    -user can now delete nodes (deleting node also deletes its connections)
    -began organizing js functions in questMap.js
    -can now pan over buttons without causing issues
    -a bunch of other junk in questMap.js I think