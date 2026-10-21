const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/../assets/horizon/horizon-navigation.js','utf8');
function arrival(from,to,{reduce=false,desktop=true,navigation=true}={}){
 const events={},classes=[],root={dataset:{},classList:{add:c=>classes.push(c)}},menu={open:!desktop};let skipped=false;
 vm.runInNewContext(source,{addEventListener:(n,f)=>events[n]=f,matchMedia:q=>({matches:q.includes('reduced')?reduce:desktop}),window:navigation?{navigation:{activation:{from:from?{url:'https://example.com'+from}:null}}}:{},location:{pathname:to},URL,document:{documentElement:root,querySelector:()=>menu}});
 const transition={skipTransition(){skipped=true}};events.pagereveal({viewTransition:transition});
 return {root,classes,menu,skipped,events,transition};
}
test('navigation order gives forward and backward page slides',()=>{
 assert.equal(arrival('/','/cv/').root.dataset.navDirection,'forward');
 assert.equal(arrival('/gallery/','/projects/').root.dataset.navDirection,'backward');
 assert.equal(arrival('/unknown/','/cv/').root.dataset.navDirection,'forward');
});
test('native activation is optional and incoming content remains visible',()=>{
 const r=arrival(null,'/cv/',{navigation:false});assert.ok(r.classes.includes('cross-page-arrival'));assert.equal(r.root.dataset.navDirection,'forward');
});
test('reduced motion skips the slide, and mobile menu is closed before capture',()=>{
 assert.equal(arrival('/','/cv/',{reduce:true}).skipped,true);
 const r=arrival('/','/cv/',{desktop:false});assert.equal(r.menu.open,false);r.menu.open=true;r.events.pageswap({viewTransition:r.transition});assert.equal(r.menu.open,false);
});
