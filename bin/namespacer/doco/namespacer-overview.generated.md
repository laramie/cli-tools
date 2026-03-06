
# Mermaid high-level flow diagrams

1. Copilot generated data flow

```mermaid
graph TD
    A[Config File#40;s#41; <br>runconfig-example.json  ] --> B[FindMain.js <br>Scan Source];

    click A href "../../namespacer-doco-plan-flow-chat.md#ANCHORMERMAID" "namespacer plan flow"

    B --> C[Plan Files <br>.gen, .plan, .interface.plan, .excludes.plan]
    C --> D[Replacer.js <br>Build Namespace Map]
    D --> E[GenerateInterface.js <br>Generate Facade]
    D --> F[Replacer.js <br>Transform Source]
    E --> G[Output: data/out/*.js <br>Facade Interface Files]
    F --> H[Output: data/out/*.js <br>Transformed Source]
    C -. Manual Copy/Edit .-> C
    C -. Manual Edit .-> E
    B -. Manual Run .-> B
    
```

# Links: 

1. Data Flow
    * Config file sets options for FindMain: [runconfig-example.json](../runconfig-example.json) 
    * Every run produces an [accumulator.plan](../data/plans/accumulator.plan)

2. Application Plan Flow
    * PlanRunner reads FindMain's config file: [runconfig-example.json](../runconfig-example.json) 
    * PlanRunner executes FindMain