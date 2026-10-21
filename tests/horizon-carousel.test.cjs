const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const source=readFileSync(__dirname+'/../assets/horizon/horizon-carousel.js','utf8');
function fixture(reduce=false){
 const node=()=>({events:{},attrs:{},addEventListener(k,f){this.events[k]=f},setAttribute(k,v){this.attrs[k]=v}});
 const slides=Array.from({length:4},(_,i)=>({offsetLeft:i*1000,dataset:{caption:'Scene '+i}}));
 const track=Object.assign(node(),{children:slides,scrollLeft:0,classList:{add(){},remove(){}},setPointerCapture(){},scrollTo(o){this.last=o;this.scrollLeft=o.left;this.events.scroll?.()}});
 const dots=slides.map((_,i)=>Object.assign(node(),{dataset:{slide:String(i)}}));
 const previous=node(),next=node(),caption={},count={},controls={hidden:true};
 const map={'.landscape-track':track,'[data-previous]':previous,'[data-next]':next,'.landscape-caption [data-caption]':caption,'[data-count]':count,'.landscape-controls':controls};
 let resize;
 vm.runInNewContext(source,{document:{querySelector:()=>({querySelector:s=>{assert.ok(map[s],'selector targets the intended control: '+s);return map[s]},querySelectorAll:()=>dots})},matchMedia:()=>({matches:reduce}),ResizeObserver:class{constructor(f){resize=f}observe(){}}});
 return {track,dots,previous,next,caption,count,slides,controls,resize};
}
test('buttons, dots and boundaries reflect the visible photograph',()=>{
 const f=fixture();assert.equal(f.controls.hidden,false);assert.equal(f.previous.disabled,true);
 f.next.events.click();assert.equal(f.track.scrollLeft,1000);assert.equal(f.caption.textContent,'Scene 1');assert.equal(f.count.textContent,'2 / 4');
 f.dots[3].events.click();assert.equal(f.next.disabled,true);assert.equal(f.dots[3].attrs['aria-current'],'true');
 f.next.events.click();assert.equal(f.track.scrollLeft,3000);f.previous.events.click();assert.equal(f.track.scrollLeft,2000);
});
test('keyboard and reduced motion work without automatic rotation',()=>{
 const f=fixture(true);let prevented=false;f.track.events.keydown({key:'End',preventDefault(){prevented=true}});
 assert.ok(prevented);assert.equal(f.track.last.behavior,'instant');assert.equal(f.count.textContent,'4 / 4');
 f.track.events.keydown({key:'Home',preventDefault(){}});assert.equal(f.track.scrollLeft,0);
});
test('rapid next clicks accumulate while unchanged scroll frames do not repeat announcements',()=>{
 const f=fixture();let writes=0;Object.defineProperty(f.caption,'textContent',{set(){writes++}});
 f.track.events.scroll();f.track.events.scroll();assert.equal(writes,0);
 f.track.scrollTo=function(o){this.last=o};f.next.events.click();f.next.events.click();assert.equal(f.track.last.left,2000);
});
test('mouse drag snaps, touch stays native, and resize preserves the selected picture',()=>{
 const f=fixture();f.track.events.pointerdown({pointerType:'touch',button:0,clientX:800,pointerId:1});f.track.events.pointermove({clientX:0});assert.equal(f.track.scrollLeft,0);
 f.track.events.pointerdown({pointerType:'mouse',button:0,clientX:800,pointerId:2});f.track.events.pointermove({clientX:100});f.track.events.pointerup();assert.equal(f.track.scrollLeft,1000);
 f.slides.forEach((s,i)=>s.offsetLeft=i*500);f.resize();assert.equal(f.track.scrollLeft,500);assert.equal(f.count.textContent,'2 / 4');
});
