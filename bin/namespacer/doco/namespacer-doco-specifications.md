# This document's version: V3

# Purpose
This conversation continues the chat about producing developer milestone and implementation planning to complete the project "namespacer" which lives in ~/infinite-neck/bin/namespacer/
 
# References
This document is called "the specifications":
    * bin/namespacer/doco/namespacer-doco-specifications.md
The main artifact of this document is called "the generated document" and is found here: 
    * bin/namespacer/doco/namespacer-overview.generated.md
If there is any question, you may consult the markdown capture of the original chat here (although it should not be necessary and may be out of date, since the main artifact, "the generated document" already contains all the implemented requests, and this current document, "the specifications", contains all new requests and background).  Old chat: 
    * bin/namespacer/namespacer-doco-plan-flow-chat.md

1. This current document lives here: 
    * ~/infinite-neck/bin/namespacer/doco/namespacer-doco-specifications.md

# Basic Definitions and Specifications

1. specs:
   * This project is all ES6.  Ensure only import/export and type=module syntax/stragegy is used.

    * when we say ~/infinite-neck we mean the project root folder for the owning project "infinite-neck".  This is the project root folder for our development environment managed by VSCode.

    * It is easiest for us to use VSCode's Copy Relative Path command for creating paths to referrenced files.  Please understand that when you see a path such as
        * bin/namespacer/doco/namespacer-overview-example.md
        * that path is relative to the project workspace in VSCode which you see, and looks to us like ~/infinite-neck/

    * any markdown links, however, are relative to the current directory of where this current document and related "doco" lives ( ~/infinite-neck/bin/namespacer/doco/ ), and are described below when we talk about links and examples.

    * when we say namespacer/ we mean ~/infinite-neck/bin/namespacer/ the root for the namespacer sub project, that really just runs as ~/infinite-neck/ by using relative paths in the jest tests, shell scripts, and command-line utilities.  

    * when we say namespacer without a trailing slash, we mean this "namespacer" project generally, which includes its source directory namespacer/ but also includes concept-level discussion, such as "how do we get namespacer to run FindMain.js"

    * The mermaid renderer, "Markdown Preview Mermaid Support" v1.32.0 has the following requirements for "graph TD" diagrams:
        1. Do not use parentheses when creating text, use markdown escapes.
          This would produce (s) properly:
           #40;s#41;
        2. Do not use \n sequence for hard returns, use <br> 

     
# Background for Copilot to understand new actions listed in "Current Actions and Updates" section. No new actions to take in this section.

1. We'd like you to maintain and update the markdown document ( namespacer-overview.generated.md ), with links to the directories, source files, and plan files and artifacts of namespacer, as you have in previous iterations.  

2. That target markdown document is herein now simply called: namespacer-overview.generated.md 
    * That document lives in this project in the folder and filename: 
        * ~/infinite-neck/bin/namespacer/doco/ 
            * Link: [namespacer documentation (doco) directory](../doco/) 
        * ~/infinite-neck/bin/namespacer/doco/namespacer-overview.generated.md
            * Link: [namespacer-overview.generated.md]( ../doco/namespacer-overview.generated.md ) 
    * That document is checked into version control -- you are welcome to make changes to it.
    * Please consult the existing version to understand the work you've done so far, and preserve any information that is up-to-date.
    * Note that the links in the document work well for us both in VSCode and on GitHub when viewing our project.  Please consult the format you used in this document when making changes.  
        
3. Previously, you took a pass at summarizing our conversation from previous chats. Now, please just consult the generated document and this specifications document as the master documents for your work. Your output should update ( ../doco/namespacer-overview.generated.md ).  What is there is to show what you generated on the last iteration.  We especially like the links to source code and directories as we define what PlanRunner.js will do, and what steps we, as developers, need to do.  We will use the generated markdown document as our roadmap for development, and for running all the tools in namespacer.  

4. After reviewing your report produced in ../doco/namespacer-overview.generated.md we will refine the output with future request to you in the section "Current Actions and Updates".  You may ignore any actions listed in "Past Actions and Updates [archived]".  They are there for us to understand only key steps in the evolution of the document.  However, this document and the generated document will be archived in version control.

# Past Actions and Updates [archived: take no actions]

1. Document generation requested, version commit: 56bf6a637d238311c4501e9cf7089c3b8540ff87

2. Generated document version commit: fa451fe133e7cb3a946155155701aaeb7844310a

    *  Version V2 Actions [archived: take no actions]

        1. Please update the generated document's version, in the beginning of the document where it says: 
            * This document's version: V{current-specifications-version}
            * After generation, that version number should match the version number of *this* specifications document, e.g. V1, V2, etc, which leads, and is found in the header: 
                * This document's version: V{current-specifications-version}

        2. Please add a section called "Experimental Strategies".

        3. For this revision, please add content to this section that contains your analysis and recommendations of the following steps.  

        4. Please help us outline a strategy for capturing the information that is currently produced in two places:
            * any calls to Accumulator.accumulate()  These have high-level steps, not detailed dumps or JSON.stringify() calls generally.  Each is supposed to name a single action or start of a plan step, such as read source file from disk, output accumulator output, output .plan files, output .gen files, output .js files and I*.js Interface Facade files.  Many of these are being logged to the Accumulator yet.
            * any calls to file I/O should be tracked somehow in this new Accumulator strategy.

        5. Our current request proposes a strategy of adding an Accumulator call called Accumulator.addPlanStep() that would allow us to pass in more information, such as the main source file being processed, and files that are generated while processing this source file.  We like the current accumulate() calls being added to its array and won't be changing that: it functions as a high-level, simple log.  We are talking about a new data structure Accumulator will keep with the objects described below in step 7.

        6. You can see in PlanRunner that there are 3 basic steps:
            * Search:
                * findMain.runWithNamedOptionsFile(configFilename, regexSuites, prePlanActions);
                
            * Generate Interfaces:
                * const replacer = new Replacer(this.namespacerPlan);
                * let masterNamespaceMap = replacer.
                * processAllNamespaces_ReturnMasterNamespaceMap();
                
            * Replace:
                * replacer.processAllSources(masterNamespaceMap);

        7. We envision a JSON structure like PlanRunner.NamespacerPlan, with structured objects below the .sources and .interfaces objects tracing the calls made to Accumulator.addPlanStep().  We don't really know how this will work, so we are looking for recommendations on 
            * the structure of the object
            * the code locations where we might use it

        8. When designing this structure/API, please follow the workflow that we will use: For each .sources, there is one source file that is compared to the masterNamespaceMap and will get output eventually.  We can consider everything that happens to this file (reading .plan files, reading .excludes, .interfaces, consulting masterNamespaceMap) to be part of a chain of events we want to plan and track in this output data structure.  Similarly Generator actions from PlanRunner.NamespacerPlan.interfaces should be considered a related yet separate flow.  It may be stored at the top level in the output accumulator datastructure.

        9. The final output in this "Experimental Strategies" section should be a proposed JSON/JS object data structure.

        10. Please include questions for us that would help us refine our next iteration, based on best practices you see in similar projects out in the world, and your analysis of our request.

# Current Actions and Updates [please perform these actions]

1. Please create a new markdown document in this directory called "TODO.md"  Move current and future TODO items in here, each with a top-level H1 heading (#)

2. Please create a new markdown document in this directory called "CHANGELOG.md" for any TODOs that are migrated from TODO.md upon completion.  Each Version update request (e.g. *this* document is changed to V3, so the generated document is moved to V3, so then cut a new H1 in CHANGELOG.md with a title and bullet points for the items listed in the requesting "Current Actions and Updates" section here.  This specifications document replaces previous requests which are in older commits in version control, and is once again properly called:
    * bin/namespacer/doco/namespacer-doco-specifications.md

3. Please provide links to these documents in the following links:
    *  link to the CHANGELOG.md under the existing heading "This document's version:...." as a bullet point
    * link to the TODO.md in the current document section called "TODO" as a bullet point.  It simply points to the TODO.md, it does not have individual H1's referenced.

4. Please migrate any points under the current TODO section to TODO.md as H1 sections with bullet points

3. Please add these new, current TODO items as a new H1 in TODO.md: 
    * move all file I/O operations to Accumulator, which will have an API for all file access
    * move all logging to Accumulator which will have an API for all logging access. 

4. Thanks, and Good Luck!!!!


