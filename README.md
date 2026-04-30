Project 3 REFLECTION
4/23/2026
--------------------------
I think that so far the project is going well. I am disatisfied with the current logo and seeking a better name for the project however other than that I believe things are going well. The remainder of this project I believe will focus on more control over cards for the user, cleaner css for the description page, and adding the actual mapping page and javaScript. Some "Technologies" I used in this project are the font-awesome library, bootstrap framework, JSON files, javaScript, HTML, and CSS. I do think I will be challenged to complete the mapping section due to delays caused by my ER visit however I belive at this point that it is completable. I'm having a great deal of fun making this site so far. 

INTENTS
    -make map page mobile friendly (the buttons currently go beyond screen boundries when the screen width is to small)(zooming in too much makes buttons overlap | not the slightest clue how to make zooming the normal way work well. May have to find a way to disable)
    -fix the nodes highlighting before they are visually reached in questMap.js
    -create ability for quest cards to be removed individually
    -cards should become reorderable
    -cards should have fields editable after creation
    -<i class="fa-solid fa-skull"></i> make replace X in difficulty
    -find a nice font
    -locate all instances of carouselContainerContainer Id and references to it and replace with a better name
    -allow user to scale and translate their image before sending it into html as a card
    -resize sideNav button (not sure about this one)
    -proceeding form becoming more centered (complete?)
    -increase readability of favicon
    -header logo needs to shrink when zooming in to allow other parts to fit on screen.
    -make resizing screen and zooming work on all pages without issue
    -allow user to pick a color for mapNodes

BUGS/ISSUES
    -opening a json without set regions does not reset regions to a default
    -when hovering over mapping buttons moving the mouse too low can cause a "bouncing" loop
    -highlighting text in the form then dragging mouse out of form before releasing closes form
    -currently a node/connection at the bottom of the screen overlapping the ui button area can not be clicked (the node should not be clickable through the buttons themselves but should be in the area around them with no buttons.)
    -uploading the json on the main page and refreshing will revert to the prior version saved to the DB (fixed I think | need to check)

README RULES
    - ~ADJUSTED:filename [function/"entry"] will list all functions that received any adjustment
    - +NEW:filename [function/"entry"] will list all newly added functions
    - three rows of hashtags in README now indicates beginning of a major section of updates
    - entry in readme with '- gitUpdate' indicates I pushed something to gitHub on that day
    - each days entry is seperated by a single row of hashtags
    - asterisks are used so ctrl+f may be used to navigate to each date or major section do not use * in other context unless absolutely necessary

##############################################################################################################
##############################################################################################################
##############################################################################################################
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
##############################################################################################################
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
##############################################################################################################
**4/27/2026
    -updated mode switching to be state based
    -now in default mode clicking a node or connection will let you change certain values
    -added code so that the little speech nib will face the node best as it can
    -added several classes for speech nib
    -added css classes for node/connection editor
    -changed order of mode buttons
    -canvas now resizes when window resizes
    -three rows of hashtags in README now indicates beginning of a major section of updates
    -pressing file button now changes its appearance for a moment
##############################################################################################################
**4/28/2026 - gitUpdate
    -created a unified export.js for downloads
    -broke uploads slightly
    -fixed uploads
    -made import and export .js to unify downloads and uploads across pages. (make json consistant)
    -organized cardInserter.js
    -added sideBar regions for MORE BUTTONS on the map page
    -a whole lot of organizing (still incomplete)
    -region modifiers now accesable to user
##############################################################################################################
**4/29/2026
    -updated node appearance
    -user can now delete regions
    -user can now create regions
    -user can now save changes to region
    -new README rule ~ADJUSTED:filename [function/"entry"] will list all functions that received any adjustment (today will be imperfect)
    -new README rule +NEW:filename [function] will list all newly added functions (today will be imperfect)
    ~ADJUSTED:questMap.js [drawNode, openNodeEditor, hydrateMap]
    +NEW:questMap.js [createRegion, ]
    -created rules section in README
    -created a planning folder to hold project plans
    -started commenting inside functions in questMap.js in a more readable way using //========== "purpose" ==========// format
    -started styling questDetails with questDetails.css
    -questDetails is the first mobile friendly page. (if the height is more than the width the layout changes)
    -increased mobile friendlyness of index page
    -replaced ctx fill and stroke colors with rgb values instead of color names
##############################################################################################################
**4/30/2026 - gitUpdate
    -corrected date on this and previous entry