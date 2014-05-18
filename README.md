meadowphysics
========

(max) complex cascading counter

april 2014 tehn@monome.org

best experienced with a variable brightness 128.


set countdown positions. when they hit 0 (leftmost) a trigger occurs.

on trigger, a few things happen:

1. event is generated. currently this is hard-mapped to teletype (another app).
2. count is reset.
3. linked rows have their positions subtracted by one.
4. a "rule" is executed.

only the top row is constantly triggered by the metro.

to have other rows count down, you need to link them.

holding down the leftmost keys shows the output linking for each row.

so, by pushing the topleft key, you'll see the rows that will get subtracted when row 0 hits 0. by default none are selected. while holding the top-left key, push the middle of other rows to toggle them.

you can have multiple rows triggering the same row. a row cannot trigger itself. it's quite easy to create strange evolving polyrhythmic counting.

set a rule by holding down the two leftmost keys, per row. select the rule by vertically on the right side of the grid-- the icon will change. select the destination row for the rule execution in the middle of the grid.

rules: none, increment, decrement, set to max, set to min, random, random inc/dec, recall last pressed.

for example, on row 0, a rule of random with destination row 0: on each trigger, a random new starting position will be chosen.

for example, on row 1, a rule of increment destination row 0: on each trigger of row 1, row 0 will get reset to a position one greater than its previous reset position.
