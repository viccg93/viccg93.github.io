//all values are assumed in pixels
//heightRelation is an array representing scale for every row in the sheet
function generateAtlas(rows, columns, spriteWidth, spriteHeight, heightRelation, xLineGap, yLineGap){
    let atlas = []
    if(heightRelation != null && rows == (heightRelation.length)){
        //indexes ought to be initialised on zero due to first spaces are only gaps in the spritesheet
        let yAxisCovered = 0
        for(let rowIndex=0; rowIndex<rows; rowIndex++){
            for(let colIndex=0; colIndex<columns; colIndex++){
                atlas.push(
                    {
                        x: xLineGap + (colIndex*spriteWidth),
                        y: yLineGap + yAxisCovered,
                        width: spriteWidth,
                        height: spriteHeight * heightRelation[rowIndex]
                    }
                )
            }
            //this does summarizes distance fully and effectively processed
            yAxisCovered+= yLineGap + spriteHeight*heightRelation[rowIndex]
        }
    }
    return atlas
}

export {generateAtlas}

/*
-- prev

Array(40) [ {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, … ]
​
0: Object { x: 0, y: 0, width: 140, … }
​
1: Object { x: 140, y: 0, width: 140, … }
​
2: Object { x: 280, y: 0, width: 140, … }
​
3: Object { x: 420, y: 0, width: 140, … }
​
4: Object { x: 560, y: 0, width: 140, … }
​
5: Object { x: 700, y: 0, width: 140, … }
​
6: Object { x: 840, y: 0, width: 140, … }
​
7: Object { x: 980, y: 0, width: 140, … }
​
8: Object { x: 0, y: 165, width: 140, … }
​
9: Object { x: 140, y: 165, width: 140, … }
​
10: Object { x: 280, y: 165, width: 140, … }
​
11: Object { x: 420, y: 165, width: 140, … }
​
12: Object { x: 560, y: 165, width: 140, … }
​
13: Object { x: 700, y: 165, width: 140, … }
​
14: Object { x: 840, y: 165, width: 140, … }
​
15: Object { x: 980, y: 165, width: 140, … }
​
16: Object { x: 0, y: 330, width: 140, … }
​
17: Object { x: 140, y: 330, width: 140, … }
​
18: Object { x: 280, y: 330, width: 140, … }
​
19: Object { x: 420, y: 330, width: 140, … }
​
20: Object { x: 560, y: 330, width: 140, … }
​
21: Object { x: 700, y: 330, width: 140, … }
​
22: Object { x: 840, y: 330, width: 140, … }
​
23: Object { x: 980, y: 330, width: 140, … }
​
24: Object { x: 0, y: 495, width: 140, … }
​
25: Object { x: 140, y: 495, width: 140, … }
​
26: Object { x: 280, y: 495, width: 140, … }
​
27: Object { x: 420, y: 495, width: 140, … }
​
28: Object { x: 560, y: 495, width: 140, … }
​
29: Object { x: 700, y: 495, width: 140, … }
​
30: Object { x: 840, y: 495, width: 140, … }
​
31: Object { x: 980, y: 495, width: 140, … }
​
32: Object { x: 0, y: 660, width: 140, … }
​
33: Object { x: 140, y: 660, width: 140, … }
​
34: Object { x: 280, y: 660, width: 140, … }
​
35: Object { x: 420, y: 660, width: 140, … }
​
36: Object { x: 560, y: 660, width: 140, … }
​
37: Object { x: 700, y: 660, width: 140, … }
​
38: Object { x: 840, y: 660, width: 140, … }
​
39: Object { x: 980, y: 660, width: 140, … }
*/