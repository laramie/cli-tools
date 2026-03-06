# Purpose
This conversation continues the chat about producing developer milestone and implementation planning to complete the project "namespacer" which lives in ~/infinite-neck/bin/namespacer/
 
# References
Please see the markdown capture of that chat here: ~/infinite-neck/bin/namespacer/namespacer-doco-plan-flow-chat.md

1. This current document lives here: 
    * /home/laramie/infinite-neck/bin/namespacer/doco/namespacer-doco-specifications.md

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

     
# Actions for Copilot
1. Now, we'd like to produce a markdown document ( namespacer-overview.generated.md ), with links to the directories, source files, and plan files and artifacts of namespacer.  

2. That target markdown document is herein now simply called: namespacer-overview.generated.md 
    * That document will live in this project in the folder and filename: 
        * ~/infinite-neck/bin/namespacer/doco/ 
            * Link: [namespacer documentation (doco) director](../doco/) 
        * ~/infinite-neck/bin/namespacer/doco/namespacer-overview.generated.md
            * Link: [namespacer-overview.generated.md](../doco/namespacer-overview.generated.md) 
    * That document is checked into version control -- you are welcome to make changes to it.  

3. We have included an example document, with links that work.  You should consult this when making links in your markdown output, especially when calculating relative paths.  The relative paths in this example document work:
    * bin/namespacer/doco/namespacer-overview-example.md  

4. Now please take a pass and summarizing our conversation in ( bin/namespacer/doco/namespacer-doco-plan-flow-chat.md ). Please reproduce the report part of that conversation in clean markdown that you will be able to edit in the future to update as we refine our plan. We especially want to add links to source code and directories as we define what PlanRunner.js will do, and what steps we, as developers, need to do.  We will use the generated markdown document as our roadmap for development, and for running all the tools in namespacer.    

