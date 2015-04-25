inlets = 1;
outlets = 1;

var L2 = 15;
var L1 = 9;
var L0 = 5;

var XSIZE = 16;
var YSIZE = 8;
var varBright = 0;

var key_count = 0;
var mode = 0;		// 0 = normal, 1 = route, 2 = rules
var prev_mode = 0;
var edit_row = 0;
var dirty_grid = 0;

var i1, i2, i3;

var positions = new Array(3,1,2,2,3,3,5,7);
var points = new Array(3,1,2,2,3,3,5,7);
var points_save = new Array(3,1,2,2,3,3,5,7);
var triggers = new Array(0,0,0,0,0,0,0,0);
var trig_dests = new Array(0,0,0,0,0,0,0,0);
var rules = new Array(0,0,0,0,0,0,0,0);
var rule_dests = new Array(0,1,2,3,4,5,6,7);

var glyph = [[0,0,0,0,0,0,0,0],					// o
			 [0,24,24,126,126,24,24,0],			// +
			 [0,0,0,126,126,0,0,0],				// -
			 [0,96,96,126,126,96,96,0],			// >
			 [0,6,6,126,126,6,6,0],				// <
			 [0,102,102,24,24,102,102,0],		// * rnd
			 [0,120,120,102,102,30,30,0],		// <> up/down
			 [0,126,126,102,102,126,126,0]];	// [] return

var leds = new Array(128);
var buffer = new Array(64);

function e(s) {
	eval(s);
}

function forceRedraw() {
	dirty_grid = 1;
	redraw();
}

function redraw() {
	if(dirty_grid != 0) {
		// clear grid
		for(i1=0;i1<128;i1++)
			leds[i1] = 0;

		if(mode == 0) {
			for(i1=0;i1<8;i1++) {
				for(i2=positions[i1];i2<=points[i1];i2++)
					leds[i1*16 + i2] = L1;

				leds[i1*16 + positions[i1]] = L2;
			}
		}
		else if(mode == 1) {
			leds[edit_row * 16] = L1;
			leds[edit_row * 16 + 1] = L1;

			for(i1=0;i1<8;i1++) {
					if((trig_dests[edit_row] & (1<<i1)) != 0) {
					for(i2=2;i2<16;i2++)
					leds[i1*16 + i2] = L2;
				}
				leds[i1*16 + positions[i1]] = L0;
			}
		}
		else if(mode == 2) {

			leds[edit_row * 16] = L1;
			leds[edit_row * 16 + 1] = L1;

			for(i1=2;i1<6;i1++) leds[rule_dests[edit_row] * 16 + i1] = L2;

			for(i1=6;i1<16;i1++) leds[rules[edit_row] * 16 + i1] = L0;

			for(i1=0;i1<8;i1++) {
				leds[i1*16 + positions[i1]] = L0;
			}

			for(i1=0;i1<8;i1++) {
				i3 = glyph[rules[edit_row]][i1];
				for(i2=0;i2<8;i2++) {
					if((i3 & (1<<i2)) != 0)
						leds[i1*16 + 8 + i2] = L2;
				}
			}

			leds[rules[edit_row] * 16 + 7] = L2;
		}

		if(varBright==1) { // break apart into maps regions
			for(i1=0;i1<8;i1++)
				for(i2=0;i2<8;i2++)
					buffer[i1*8+i2] = leds[i1*16+i2];
			outlet(0,"map0",buffer);

			for(i1=0;i1<8;i1++)
				for(i2=0;i2<8;i2++)
					buffer[i1*8+i2] = leds[i1*16+i2+8];
			outlet(0,"map1",buffer);
		}
		else { // non-varbright leds
			var mask0 = 0;
			var mask1 = 0;
			for(y=0;y<YSIZE;y++) {
				for(x=0;x<8;x++) {
					if(leds[x+y*16]>3) mask0 = mask0 | 1<<x; // if on at all, set to full bright
					else mask0 = mask0 & ~(1<<x); // if off, leave cell off
				}
				for(x=0;x<8;x++) {
					if(leds[x+y*16+8]>3) mask1 = mask1 | 1<<x; // if on at all, set to full bright
					else mask1 = mask1 & ~(1<<x); // if off, leave cell off
				}
				outlet(0,"/mp/grid/led/row",0,y,mask0,mask1);
			}

		}

		dirty_grid = 0;
	}
}

function size(sx, sy) {
	XSIZE = sx;
	YSIZE = sy;
}

function variableB(x) { varBright = x; } // is device varibright compatible

function key(kx, ky, state) {
	prev_mode = mode;

	// mode check
	if(kx == 0) {
		key_count += (state<<1)-1;

		if(key_count == 1 && state == 1)
			mode = 1; 
		else if(key_count == 0)
			mode = 0;

		if(state == 1 && mode == 1) {
			edit_row = ky;
			dirty_grid = 1;
			// post("edit row:",edit_row);
		}
	}
	else if(kx == 1 && mode != 0) {
		if(mode == 1 && state == 1)
			mode = 2;
		else if(mode == 2 && state == 0)
			mode = 1;
	}
	else if(mode == 0 && state == 1) {
		points[ky] = kx;
		points_save[ky] = kx;
		positions[ky] = kx;
		dirty_grid = 1;
	}
	else if(mode == 1 && state == 1) {
		if(ky != edit_row) {		// filter out self-triggering
			trig_dests[edit_row] ^= (1<<ky);
			dirty_grid = 1;
			// post("\ntrig_dests", edit_row, ":", trig_dests[edit_row]);
		}
	}
	else if(mode == 2 && state == 1) {
		if(kx > 1 && kx < 6) {
			rule_dests[edit_row] = ky;
			dirty_grid = 1;
			// post("\nrule_dests", edit_row, ":", rule_dests[edit_row]);
		}
		else if(kx > 5) {
			rules[edit_row] = ky;
			dirty_grid = 1;
			// post("\nrules", edit_row, ":", rules[edit_row]);
		}
	}

	if(mode != prev_mode) {
		dirty_grid = 1;
		// post("\nnew mode", mode);
	}

}

function next() {
	var n1;

	// post("\n==== next")
	for(n1=0;n1<8;n1++)
		triggers[n1] = 0;

	// main
	apply_trigger(0);

	// ensure bounds, output triggers
	for(n1=0;n1<8;n1++) {
		if(positions[n1] < 0)
			positions[n1] = 0;
		else if(positions[n1] > points[n1])
			positions[n1] = points[n1];

		outlet(0,"position",n1,positions[n1]);

		if(triggers[n1]) {
			outlet(0,"trigger",n1);
		}
	}
	dirty_grid = 1;
}

function apply_trigger(n) {
	var m;

	positions[n]--;

	// ****** the trigger # check is so we don't cause a trigger/rules multiple times per NEXT
	// a rules-based jump to position-point does not current cause a trigger. should it?
	if(positions[n] < 0 && triggers[n] == 0) {
		triggers[n]++;
	
		if(rules[n] == 1) {			// inc
			if(points[rule_dests[n]] < (XSIZE-1)) {
				points[rule_dests[n]]++;
				positions[rule_dests[n]] = points[rule_dests[n]];
			}
		}
		else if(rules[n] == 2) {	// dec
			if(points[rule_dests[n]] > 0) {
				points[rule_dests[n]]--;
				positions[rule_dests[n]] = points[rule_dests[n]];
			}
		}
		else if(rules[n] == 3) {	// max
			points[rule_dests[n]] = (XSIZE-1);
			positions[rule_dests[n]] = points[rule_dests[n]];
		}
		else if(rules[n] == 4) {	// min
			points[rule_dests[n]] = 0;
			positions[rule_dests[n]] = points[rule_dests[n]];
		}
		else if(rules[n] == 5) {	// rnd
			points[rule_dests[n]] = Math.floor(Math.random()*XSIZE);
			positions[rule_dests[n]] = points[rule_dests[n]];
		}
		else if(rules[n] == 6) {	// up/down
			points[rule_dests[n]] += Math.floor(Math.random()*3) - 1;
			if(points[rule_dests[n]] < 0) points[rule_dests[n]] = 0;
			else if(points[rule_dests[n]] > (XSIZE-1)) points[rule_dests[n]] = XSIZE-1;
			positions[rule_dests[n]] = points[rule_dests[n]];			
		}
		else if(rules[n] == 7) {	// return
			points[rule_dests[n]] = points_save[rule_dests[n]];
		}


		//reset
		positions[n] += points[n] + 1;

		//triggers
		for(m=0;m<8;m++)
			if((trig_dests[n] & (1<<m)) != 0)
				apply_trigger(m);
				// post("\ntrigger",n," -> ", m);
	}
}