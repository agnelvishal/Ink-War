onrender.com puts server to sleep if not used. https://gundb.onrender.com
--
Right now, it rotates in 90 degree angle when button is pressed. It should rotate at very small angles based on how long it is pressed.

---
In mobile, the buttons to change direction are 90% hidden. Remove the buttons. Let user rotate by clicking anywhere on screen.


---
One needs to move paint brush with up and down buttons in screen for mobile. 2 to 6 players in one screen. One with maximum color wins. Each player has one color.

Use html, css and js. Use additional packages if required.


You can use gundb for sync across devices.

Below info on gundb can be used.
<p id="readme"><a href="https://gun.eco/"><img width="40%" src="https://cldup.com/TEy9yGh45l.svg"/></a><img width="50%" align="right" vspace="25" src="https://gun.eco/see/demo.gif"/></p>

[![](https://data.jsdelivr.com/v1/package/npm/gun/badge)](https://www.jsdelivr.com/package/npm/gun)
![Build](https://github.com/amark/gun/actions/workflows/ci.yml/badge.svg)
[![Gitter](https://img.shields.io/gitter/room/amark/gun.js.svg)](http://chat.gun.eco)

**GUN** is an [ecosystem](https://gun.eco/docs/Ecosystem) of **tools** that let you build [community run](https://www.nbcnews.com/tech/tech-news/these-technologists-think-internet-broken-so-they-re-building-another-n1030136) and [encrypted applications](https://gun.eco/docs/Cartoon-Cryptography) - like an Open Source Firebase or a Decentralized Dropbox.

The [Internet Archive](https://news.ycombinator.com/item?id=17685682) and [100s of other apps](https://github.com/amark/gun/wiki/awesome-gun) run GUN in-production.

 + Multiplayer by default with realtime p2p state synchronization!
 + Graph data lets you use key/value, tables, documents, videos, & more!
 + Local-first, offline, and decentralized with end-to-end encryption.

Decentralized alternatives to [Zoom](https://www.zdnet.com/article/era-hatches-meething-an-open-source-browser-based-video-conferencing-system/), [Reddit](https://notabug.io/t/whatever/comments/36588a16b9008da4e3f15663c2225e949eca4a15/gpu-bot-test), [Instagram](https://iris.to/), [Slack](https://iris.to/), [YouTube](https://d.tube/), [Stripe](https://twitter.com/marknadal/status/1422717427427647489), [Wikipedia](https://news.ycombinator.com/item?id=17685682), Facebook [Horizon](https://twitter.com/marknadal/status/1424476179189305347) and more have already pushed terabytes of daily P2P traffic on GUN. We are a [friendly community](http://chat.gun.eco/) creating a [free fun future for freedom](https://youtu.be/1HJdrBk3BlE):

<table>
<tr>
<a href="https://youtu.be/s_m16-w6bBI"><img width="31%" src="https://gun.eco/see/3dvr.gif" title="3D VR"/></a>
<a href="https://github.com/cstefanache/cstefanache.github.io/blob/06697003449e4fc531fd32ee068bab532976f47b/_posts/2016-08-02-gun-db-artificial-knowledge-sharing.md"><img width="31%" src="https://gun.eco/see/aiml.gif" title="AI/ML"/></a>
<a href="http://gps.gunDB.io/"><img width="31%" src="https://gun.eco/see/gps.gif" title="GPS"/></a>
</tr>
<tr>
<a href="https://github.com/lmangani/gun-scape#gun-scape"><img width="31%" src="https://gun.eco/see/dataviz.gif" title="Data Viz"/></a>
<a href="https://github.com/amark/gun/wiki/Auth"><img width="31%" src="https://gun.eco/see/p2p.gif" title="P2P"/></a>
<a href="https://github.com/Stefdv/gun-ui-lcd#okay-what-about-gundb-"><img width="31%" src="https://gun.eco/see/iot.gif" title="IoT"/></a>
</tr>
<tr>
<a href="http://chat.gun.eco"><img width="31%" src="https://gun.eco/see/vr-world.gif" title="VR World"/></a>
<a href="https://youtu.be/1ASrmQ-CwX4"><img width="31%" src="https://gun.eco/see/ar.gif" title="AR"/></a>
<a href="https://meething.space/"><img width="31%" src="https://gun.eco/see/video-conf.gif" title="Video Confernece"/></a>
</tr>
</table>
## Quickstart

GUN is *super easy* to get started with:

 - Try the [interactive tutorial](https://gun.eco/docs/Todo-Dapp) in the browser (**5min** ~ average developer).
 - Or `npm install gun` and run the examples with `cd node_modules/gun && npm start` (**5min** ~ average developer).

> **Note:** If you don't have [node](http://nodejs.org/) or [npm](https://www.npmjs.com/), read [this](https://github.com/amark/gun/blob/master/examples/install.sh) first.
> If the `npm` command line didn't work, you may need to `mkdir node_modules` first or use `sudo`.

- An online demo of the examples are available here: http://try.axe.eco/
- Or write a quick app: ([try now in a playground](https://jsbin.com/kadobamevo/edit?js,console))
```html
<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
<script>
// import GUN from 'gun'; // in ESM
// GUN = require('gun'); // in NodeJS
// GUN = require('gun/gun'); // in React
gun = GUN();

gun.get('mark').put({
  name: "Mark",
  email: "mark@gun.eco",
});

gun.get('mark').on((data, key) => {
  console.log("realtime updates:", data);
});

setInterval(() => { gun.get('mark').get('live').put(Math.random()) }, 9);
</script>
```
- Or try something **mind blowing**, like saving circular references to a table of documents! ([play](http://jsbin.com/wefozepume/edit?js,console))
```javascript
cat = {name: "Fluffy", species: "kitty"};
mark = {boss: cat};
cat.slave = mark;

// partial updates merge with existing data!
gun.get('mark').put(mark);

// access the data as if it is a document.
gun.get('mark').get('boss').get('name').once(function(data, key){
  // `once` grabs the data once, no subscriptions.
  console.log("Mark's boss is", data);
});

// traverse a graph of circular references!
gun.get('mark').get('boss').get('slave').once(function(data, key){
  console.log("Mark is the cat's slave!", data);
});

// add both of them to a table!
gun.get('list').set(gun.get('mark').get('boss'));
gun.get('list').set(gun.get('mark'));

// grab each item once from the table, continuously:
gun.get('list').map().once(function(data, key){
  console.log("Item:", data);
});

// live update the table!
gun.get('list').set({type: "cucumber", goal: "jumping cat"});
```


