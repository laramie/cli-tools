
# Mermaid high-level flow diagrams

1. Copilot generated data flow as of 20260306 with links
    * these links won't open source files, as they are, but may open URLs in the future.

```mermaid

---
config:
  config:
  theme: 'base'
  themeVariables:
    primaryColor: '#BB2528'
    primaryTextColor: '#fff'
    primaryBorderColor: '#7C0000'
    lineColor: '#F8B229'
    secondaryColor: '#006100'
    tertiaryColor: '#fff'
    fontFamily: 'Comic Sans MS'
    fontSize: '24pt'

---  
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

```mermaid
---
config:
  radar:
    axisScaleFactor: 0.25
    curveTension: 0.1
  theme: base
  themeVariables:
    cScale0: "#FF0000"
    cScale1: "#00FF00"
    cScale2: "#0000FF"
    radar:
      curveOpacity: 0.5
---
radar-beta
  axis A, B, C, D, E
  curve Libertarian{0,0,0,4,5}
  curve Conservative{5,4,3,0,1}
  curve Progressive{0,1,5,1,0}
```

# Links: 

These links are markdown links and will open files in the VSCode editor from markdown preview:

1. Data Flow
    * Config file sets options for FindMain: [runconfig-example.json](../runconfig-example.json) 
    * Every run produces an [accumulator.plan](../data/plans/accumulator.plan)

2. Application Plan Flow
    * PlanRunner reads FindMain's config file: [runconfig-example.json](../runconfig-example.json) 
    * PlanRunner executes FindMain