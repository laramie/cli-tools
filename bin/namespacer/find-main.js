import { Colors } from './colors.js';
import { FindSuites } from './find-suites.js';
import { State } from './find-state.js';
import { FindOptions } from './find-options.js';

export class FindMain {
    constructor() {
        this.colors = new Colors();
        this.suites = new FindSuites();
        this.state = new State();
        this.options = new FindOptions();
    }
    main() {
        // Main logic goes here
        console.log('FindMain.main() called');
    }

    static test(){
        let state = new State();
        state.test();
    }
}
