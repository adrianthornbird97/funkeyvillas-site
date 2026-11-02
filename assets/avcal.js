/* Funkey Villas – per-villa availability calendar.
   Data: assets/data/availability.json, synced from NightsBridge's public availability (no prices stored).
   Selecting check-in + check-out fills the booking form and links to NightsBridge for that villa and those dates. */
(function(){
  'use strict';
  var els=document.querySelectorAll('[data-avcal]');if(!els.length||!window.fetch)return;
  var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DOW=['Mo','Tu','We','Th','Fr','Sa','Su'];
  function parse(s){var p=s.split('-');return new Date(Date.UTC(+p[0],p[1]-1,+p[2]))}
  function iso(d){return d.toISOString().slice(0,10)}
  function add(d,n){return new Date(d.getTime()+n*864e5)}
  function diff(a,b){return Math.round((b-a)/864e5)}
  function fmt(d,long){return (long?DOWL[d.getUTCDay()]+' ':'')+d.getUTCDate()+' '+MON[d.getUTCMonth()].slice(0,long?99:3)+(long?' '+d.getUTCFullYear():'')}
  function todaySAST(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}catch(e){return iso(new Date(Date.now()+72e5))}}
  function ago(h){if(h<1)return Math.max(1,Math.round(h*60))+' min ago';if(h<48)return Math.round(h)+' h ago';return Math.round(h/24)+' days ago'}
  function h(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}

  Array.prototype.forEach.call(els,function(el){
    fetch(el.getAttribute('data-src')+'?t='+Math.floor(Date.now()/6e5),{cache:'no-cache'})
      .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
      .then(function(d){render(el,d)})
      .catch(function(){el.classList.add('avcal-failed')});
  });

  function render(el,d){
    var rtid=el.getAttribute('data-rtid'),nb=el.getAttribute('data-nb'),room=d.rooms&&d.rooms[rtid];
    if(!room)return el.classList.add('avcal-failed');
    var ageH=(Date.now()-Date.parse(d.checked))/36e5;
    if(!(ageH<24*7))return el.classList.add('avcal-failed','avcal-old');  // never show a calendar that is more than a week out of date
    var start=parse(d.start),n=room.free.length,today=parse(todaySAST()),t0=Math.max(0,diff(start,today));
    if(t0>=n-1)return el.classList.add('avcal-failed','avcal-old');
    var F=room.free,MS=room.minstay||[],NA=room.noarr||'',ND=room.nodep||'';
    function free(i){return i>=0&&i<n&&F.charAt(i)==='1'}
    function known(i){return i>=0&&i<n&&F.charAt(i)!=='x'}
    function minFor(i){return MS[i]||1}
    function canStart(i){return i>=t0&&free(i)&&NA.charAt(i)!=='1'}
    function maxEnd(s){var j=s+1;while(j<n&&free(j))j++;return j}
    function canEnd(j){return s!=null&&j>s&&j<=maxEnd(s)&&j-s>=minFor(s)&&ND.charAt(j)!=='1'}
    function status(i){
      if(i<t0)return 'past';if(!known(i)&&!(i===n&&known(n-1)))return 'na';
      var night=free(i),morning=(i>t0&&known(i-1))?free(i-1):night;
      if(i===n)return morning?'out':'na';
      return night?(morning?'free':'in'):(morning?'out':'booked');
    }
    var LBL={free:'available',in:'check-in only (booked until the morning)',out:'check-out only (booked from that night)',booked:'booked',past:'past',na:'not yet open for booking'};
    var s=null,e=null,hover=null;

    el.innerHTML='';el.classList.add('avcal-ready');
    var top=h('div','avcal-top');
    var legend=h('ul','avcal-legend','<li><i class="k k-free"></i>Available</li><li><i class="k k-booked"></i>Booked</li><li><i class="k k-in"></i>Check-in only</li><li><i class="k k-out"></i>Check-out only</li><li><i class="k k-sel"></i>Your stay</li>');
    var nav=h('div','avcal-nav','<button type="button" class="avcal-prev" aria-label="Previous month">&#8592;</button><button type="button" class="avcal-next" aria-label="Next month">&#8594;</button>');
    top.appendChild(legend);top.appendChild(nav);el.appendChild(top);
    var track=h('div','avcal-track');track.setAttribute('tabindex','0');track.setAttribute('aria-label','Availability calendar, swipe or scroll sideways for more months');
    el.appendChild(track);
    var cells=[];
    var first=add(start,t0),lastD=add(start,n);
    var m=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),1));
    while(m<=lastD){
      var mon=h('div','avcal-month');mon.appendChild(h('h4','avcal-mtitle',MON[m.getUTCMonth()]+' '+m.getUTCFullYear()));
      var g=h('div','avcal-grid');g.setAttribute('role','grid');
      DOW.forEach(function(x){g.appendChild(h('span','avcal-dow',x))});
      var lead=(m.getUTCDay()+6)%7;for(var k=0;k<lead;k++)g.appendChild(h('span','d d-blank'));
      var dim=new Date(Date.UTC(m.getUTCFullYear(),m.getUTCMonth()+1,0)).getUTCDate();
      for(var day=1;day<=dim;day++){
        var dt=new Date(Date.UTC(m.getUTCFullYear(),m.getUTCMonth(),day)),i=diff(start,dt),st=status(i);
        var c;
        if(st==='past'||st==='na'){c=h('span','d s-'+st,String(day));}
        else{c=h('button','d s-'+st,String(day));c.type='button';c.setAttribute('data-i',i);
          var ms=minFor(i);c.setAttribute('aria-label',fmt(dt,true)+', '+LBL[st]+(st==='free'||st==='in'?(MS[i]?', minimum stay '+ms+' night'+(ms>1?'s':''):''):''));
          if((st==='free'||st==='in')&&MS[i]>1)c.title='Min. stay '+ms+' nights';
          cells.push(c);}
        g.appendChild(c);
      }
      mon.appendChild(g);track.appendChild(mon);
      m=new Date(Date.UTC(m.getUTCFullYear(),m.getUTCMonth()+1,1));
    }
    var foot=h('div','avcal-foot');
    var msg=h('p','avcal-msg');msg.setAttribute('aria-live','polite');
    var acts=h('div','avcal-acts');
    var book=h('a','btn btn-primary avcal-book','Book these dates');book.rel='noopener';
    var clear=h('button','btn btn-ghost avcal-clear','Clear');clear.type='button';
    acts.appendChild(clear);acts.appendChild(book);foot.appendChild(msg);foot.appendChild(acts);el.appendChild(foot);

    // minimum-stay summary from the open dates in the data
    var cnt={},mx=0;for(var q=t0;q<n;q++){if(free(q)&&MS[q]){cnt[MS[q]]=(cnt[MS[q]]||0)+1;mx=Math.max(mx,MS[q])}}
    var mode=0,best=-1;for(var key in cnt){if(cnt[key]>best){best=cnt[key];mode=+key}}
    var info=h('p','avcal-info',(mode>1?'Minimum stay '+mode+' nights'+(mx>mode?' ('+mx+' on some peak dates)':'')+'. ':'')+
      'Synced with our NightsBridge booking system, last updated '+ago(ageH)+'. Your dates are confirmed live on the secure booking page.');
    if(ageH>24)info.classList.add('avcal-stale'),info.innerHTML='<strong>Heads-up:</strong> this calendar was last synced '+ago(ageH)+', so some dates may have changed. The secure booking page always shows live availability.';
    el.appendChild(info);

    function paint(){
      var me=s!=null&&e==null?maxEnd(s):-1;
      cells.forEach(function(c){
        var i=+c.getAttribute('data-i'),cl=c.classList,endRef=e!=null?e:hover;
        cl.toggle('sel-start',i===s);cl.toggle('sel-end',e!=null&&i===e);
        cl.toggle('in-range',s!=null&&endRef!=null&&i>s&&i<endRef);
        cl.toggle('preview',e==null&&hover!=null&&i===hover);
        cl.toggle('can-end',s!=null&&e==null&&canEnd(i));
        cl.toggle('too-short',s!=null&&e==null&&i>s&&i<=me&&i-s<minFor(s));
        cl.toggle('dim',s!=null&&e==null&&i>me);
        c.setAttribute('aria-pressed',(i===s||i===e)?'true':'false');
      });
      if(s==null){msg.textContent='Choose your check-in date.';foot.classList.remove('has-stay')}
      else if(e==null){msg.textContent='Check-in '+fmt(add(start,s))+'. Now choose your check-out date'+(minFor(s)>1?' (minimum '+minFor(s)+' nights)':'')+'.';foot.classList.remove('has-stay')}
      else{
        var a=add(start,s),b=add(start,e),nn=e-s;
        msg.innerHTML='<strong>'+fmt(a)+' – '+fmt(b)+' '+b.getUTCFullYear()+'</strong> · '+nn+' night'+(nn>1?'s':'');
        foot.classList.add('has-stay');
        var form=document.querySelector('#book form[data-dates]'),promo=form&&form.querySelector('[name=promocode]');
        book.href=nb+'?rtid='+encodeURIComponent(rtid)+'&startdate='+iso(a)+'&enddate='+iso(b)+(promo&&promo.value?'&promocode='+encodeURIComponent(promo.value):'');
        if(form){var fi=form.querySelector('[data-start]'),fo=form.querySelector('[data-end]');
          if(fi&&fo){fi.value=iso(a);fi.dispatchEvent(new Event('change'));fo.value=iso(b);fo.min=iso(add(a,1));}}
      }
    }
    function say(t){msg.textContent=t}
    track.addEventListener('click',function(ev){
      var c=ev.target.closest('button.d');if(!c)return;var i=+c.getAttribute('data-i');
      if(s==null||e!=null){if(canStart(i)){s=i;e=null;hover=null;paint()}else{s=null;e=null;paint();say(status(i)==='out'?'That day is check-out only – pick an earlier check-in date.':'That date is not available for check-in.')}return}
      if(canEnd(i)){e=i;hover=null;paint();return}
      if(i>s&&i<=maxEnd(s)&&i-s<minFor(s)){say('The minimum stay from '+fmt(add(start,s))+' is '+minFor(s)+' nights.');return}
      if(canStart(i)){s=i;paint();return}
      say(i>s?'Those dates include booked nights – choose an earlier check-out date.':'That date is not available for check-in.');
    });
    track.addEventListener('mouseover',function(ev){var c=ev.target.closest&&ev.target.closest('button.d');if(s==null||e!=null)return;var i=c?+c.getAttribute('data-i'):null;var nh=(i!=null&&canEnd(i))?i:null;if(nh!==hover){hover=nh;paint()}});
    clear.addEventListener('click',function(){s=e=hover=null;paint()});
    var prev=nav.querySelector('.avcal-prev'),next=nav.querySelector('.avcal-next');
    function step(){var mm=track.querySelector('.avcal-month');return mm?mm.getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap||0):track.clientWidth}
    prev.addEventListener('click',function(){track.scrollBy({left:-step(),behavior:'smooth'})});
    next.addEventListener('click',function(){track.scrollBy({left:step(),behavior:'smooth'})});
    function navState(){prev.disabled=track.scrollLeft<4;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-4}
    track.addEventListener('scroll',navState,{passive:true});window.addEventListener('resize',navState);navState();
    paint();
  }
})();
