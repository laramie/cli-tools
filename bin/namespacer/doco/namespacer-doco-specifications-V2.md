# This document's version: V2

# Purpose
This conversation continues the chat about producing developer milestone and implementation planning to complete the project "namespacer" which lives in ~/infinite-neck/bin/namespacer/
 
# References
Please see the markdown capture of that chat here: ~/infinite-neck/bin/namespacer/namespacer-doco-plan-flow-chat.md

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

     
# Actions for Copilot, background

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

3. Please update the generated document's version, in the beginning of the document where it says: 
    * This document's version: V2
    * That version number should match the version number of *this* specifications document, found in the header: 
        * This document's version: V2
        
4. Previously, you took a pass at summarizing our conversation from previous chats. Now, please just consult the generated document and this specifications document as the master documents for your work. Your output should update ( ../doco/namespacer-overview.generated.md ).  What is there is to show what you generated on the last iteration.  We especially like the links to source code and directories as we define what PlanRunner.js will do, and what steps we, as developers, need to do.  We will use the generated markdown document as our roadmap for development, and for running all the tools in namespacer.  

5. After reviewing your report produced in ../doco/namespacer-overview.generated.md we will refine the output with future request to you in the section "Current Actions and Updates".  You may ignore any actions listed in "Past Actions and Updates [archived]".  They are there for us to understand only key steps in the evolution of the document.  However, this document and the generated document will be archived in version control.

# Past Actions and Updates [archived]

1. Document generation requested, version commit: 56bf6a637d238311c4501e9cf7089c3b8540ff87
2. Generated document version commit: 


# Current Actions and Updates

1. Please 

