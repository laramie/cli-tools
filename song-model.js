function makeSong(newIndex){
    let obj = {
        //FIELDS:
            mSections: [1,2,3,4],
            mCurrentIndex: 0,
        //METHODS:
            make: make,
            showCurrentSection: showCurrentSection,
            inc: inc,
            show: show
    }
    obj.make(newIndex);
    return obj;


    function inc(){
        this.mCurrentIndex++;
        this.mCurrentIndex = ( this.mCurrentIndex +4 )%4;

    }

    function showCurrentSection(){
        return this.mSections[this.mCurrentIndex];
    }

    function make(newIndex){
        this.mCurrentIndex = newIndex;
    }

    function show(){
        return foo();
    }

    function foo(){
        return "foo was here";
    }

}

function testSongModel(){
    var songModel = makeSong(2);
    var songModel2 = makeSong(0);

    console.log("SongModel2: "+songModel2.showCurrentSection());
    for (let i=0; i<10; i++){
        console.log("SongModel: "+songModel.showCurrentSection());
        console.log("SongModel2: "+songModel2.showCurrentSection());
        songModel.inc();
    }
    console.log("SongModel2: "+songModel2.showCurrentSection());
    console.log("SongModel2.show: "+songModel2.show());
}
