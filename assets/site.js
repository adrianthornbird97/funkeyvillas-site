/* Funkey Villas — small progressive-enhancement script (no dependencies). */
(function(){
  var d=document,b=d.body;b.classList.remove('js-off');
  // Header: solid after scrolling past the hero top
  var h=d.querySelector('.site-header');
  function onScroll(){if(h)h.classList.toggle('solid',window.scrollY>40)}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  // Mobile nav
  var t=d.querySelector('.nav-toggle');
  if(t){t.addEventListener('click',function(){var o=b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o)});
    d.querySelectorAll('.nav a').forEach(function(a){a.addEventListener('click',function(){b.classList.remove('nav-open');t.setAttribute('aria-expanded','false')})});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&b.classList.contains('nav-open')){b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');t.focus()}})}
  // Reveal on scroll
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    d.querySelectorAll('.reveal').forEach(function(el){io.observe(el)})}else{d.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')})}
  // Date inputs: no past dates, departure after arrival
  function iso(dt){return dt.toISOString().slice(0,10)}
  var today=iso(new Date());
  d.querySelectorAll('form[data-dates]').forEach(function(f){
    var a=f.querySelector('input[data-start]'),z=f.querySelector('input[data-end]');if(!a||!z)return;
    a.min=today;z.min=today;
    a.addEventListener('change',function(){if(!a.value)return;var n=new Date(a.value);n.setDate(n.getDate()+1);z.min=iso(n);if(!z.value||z.value<=a.value){z.value=iso(n)}});
    f.addEventListener('submit',function(e){if(a.value&&z.value&&z.value<=a.value){e.preventDefault();z.setCustomValidity('Departure must be after arrival');z.reportValidity();z.setCustomValidity('')}});
  });
  // Destination switch on home booking bar: Cape Town -> NightsBridge, Istria -> Lodgify
  d.querySelectorAll('select[data-dest]').forEach(function(s){
    var f=s.form;function sync(){var o=s.options[s.selectedIndex];f.action=o.dataset.action;
      var a=f.querySelector('input[data-start]'),z=f.querySelector('input[data-end]');a.name=o.dataset.sname;z.name=o.dataset.ename;
      f.querySelectorAll('[data-only]').forEach(function(x){var on=x.dataset.only===s.value;x.disabled=!on;x.closest('.f')&&(x.closest('.f').hidden=!on&&x.closest('.f').classList.contains('opt'))})}
    s.addEventListener('change',sync);sync()});
  // Gallery expand
  d.querySelectorAll('[data-expand]').forEach(function(btn){btn.addEventListener('click',function(){var g=d.getElementById(btn.dataset.expand);g.classList.remove('collapsed');btn.remove()})});
  // Lightbox
  var links=[].slice.call(d.querySelectorAll('a[data-lb]'));
  if(links.length){
    var lb=d.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Photo gallery');
    lb.innerHTML='<img alt=""><button class="lb-close" aria-label="Close gallery">&times;</button><button class="lb-prev" aria-label="Previous photo">&#8592;</button><button class="lb-next" aria-label="Next photo">&#8594;</button><div class="lb-count" aria-live="polite"></div>';
    b.appendChild(lb);var im=lb.querySelector('img'),ct=lb.querySelector('.lb-count'),i=0,last=null,sx=0;
    function group(){var g=links[i].dataset.lb;return links.filter(function(l){return l.dataset.lb===g})}
    function show(k){var g=group(),cur=g.indexOf(links[i]);cur=(cur+k+g.length)%g.length;i=links.indexOf(g[cur]);
      im.style.opacity=0;var src=g[cur].getAttribute('href');var n=new Image();n.onload=function(){im.src=src;im.alt=g[cur].querySelector('img').alt;im.style.opacity=1};n.src=src;
      ct.textContent=(cur+1)+' / '+g.length;
      [-1,1].forEach(function(o){var p=g[(cur+o+g.length)%g.length];(new Image()).src=p.getAttribute('href')})}
    function open(k){last=d.activeElement;i=k;lb.classList.add('open');b.style.overflow='hidden';show(0);lb.querySelector('.lb-close').focus()}
    function close(){lb.classList.remove('open');b.style.overflow='';im.removeAttribute('src');if(last)last.focus()}
    links.forEach(function(a,k){a.addEventListener('click',function(e){e.preventDefault();open(k)})});
    lb.querySelector('.lb-close').onclick=close;lb.querySelector('.lb-prev').onclick=function(){show(-1)};lb.querySelector('.lb-next').onclick=function(){show(1)};
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    d.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(-1);if(e.key==='ArrowRight')show(1);
      if(e.key==='Tab'){var f=[].slice.call(lb.querySelectorAll('button'));var x=f.indexOf(d.activeElement);e.preventDefault();f[(x+(e.shiftKey?-1:1)+f.length)%f.length].focus()}});
    lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)show(dx<0?1:-1)});
  }
  // Open-all-photos buttons
  d.querySelectorAll('[data-open-gallery]').forEach(function(btn){btn.addEventListener('click',function(){var a=d.querySelector('a[data-lb="'+btn.dataset.openGallery+'"]');if(a)a.click()})});
  // Enquiry form: FormSubmit (normal POST -> thank-you page) if data-endpoint set, else email draft; plus WhatsApp
  var ef=d.getElementById('enquiry');
  if(ef){
    var st=ef.querySelector('.form-status');
    function compose(){var v=function(n){var el=ef.elements[n];return el&&el.value?el.value.trim():''};
      return ['Enquiry from www.funkeyvillas.com','','Name: '+v('name'),'Email: '+v('email'),'Phone: '+v('phone'),'Property: '+v('property'),'Arrival: '+v('arrival'),'Departure: '+v('departure'),'Guests: '+v('guests'),'','Message:',v('message')].join('\n')}
    ef.addEventListener('submit',function(e){
      if(ef.elements._honey&&ef.elements._honey.value){e.preventDefault();return}
      if(!ef.checkValidity()){e.preventDefault();ef.reportValidity();return}
      var subj='Booking enquiry'+(ef.elements.property.value?' – '+ef.elements.property.value:'');
      if(ef.dataset.endpoint){
        ef.elements._subject.value=subj+' (website)';
        var nx=ef.elements._next;if(nx&&nx.dataset.next){try{nx.value=new URL(nx.dataset.next,location.href).href}catch(_){}}
        st.textContent='Sending…';return; // let the browser POST to FormSubmit
      }
      e.preventDefault();
      window.location.href='mailto:'+ef.dataset.email+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(compose());
      st.textContent='Your email app should open with your enquiry ready to send. If it doesn’t, email '+ef.dataset.email+' or use WhatsApp.';
    });
    var wb=ef.querySelector('[data-wa-send]');
    if(wb)wb.addEventListener('click',function(){window.open('https://wa.me/'+ef.dataset.wa+'?text='+encodeURIComponent(compose()),'_blank','noopener')});
  }
  // Share: native share sheet where available (phones), else a small popover. No external scripts.
  var sbs=d.querySelectorAll('.share-btn');
  if(sbs.length){
    var meta=function(sel){var m=d.querySelector(sel);return m?(m.content||m.href||''):''};
    var sTitle=d.title,sText=meta('meta[name="description"]');
    function sUrl(btn){if(btn.hasAttribute('data-canon')){var c=meta('link[rel="canonical"]');if(c)return c}return location.href.split('#')[0]}
    var IC={wa:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>',
      mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
      fb:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9V7c0-.9.2-1.4 1.6-1.4H17V2.2C16.7 2.1 15.6 2 14.4 2 11.8 2 10 3.6 10 6.5V9H7v3.6h3V22h4v-9.4h3l.5-3.6H14z"/></svg>',
      x:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
      link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
      ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'};
    var pop=d.createElement('div');pop.className='share-pop';pop.id='share-pop';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Share this page');pop.hidden=true;
    b.appendChild(pop);var cur=null;
    function enc(v){return encodeURIComponent(v)}
    function items(u){return [
      ['wa','WhatsApp','https://wa.me/?text='+enc(sTitle+' '+u)],
      ['mail','Email','mailto:?subject='+enc(sTitle)+'&body='+enc(sText+'\n\n'+u)],
      ['fb','Facebook','https://www.facebook.com/sharer/sharer.php?u='+enc(u)],
      ['x','X / Twitter','https://twitter.com/intent/tweet?text='+enc(sTitle)+'&url='+enc(u)]]}
    function place(){if(!cur)return;var r=cur.getBoundingClientRect(),pw=pop.offsetWidth,ph=pop.offsetHeight,vw=d.documentElement.clientWidth,vh=window.innerHeight,m=12;
      var top=r.bottom+8;if(top+ph>vh-m&&r.top-8-ph>m)top=r.top-8-ph;
      var left=Math.min(Math.max(m,r.left),vw-pw-m);pop.style.top=Math.max(m,top)+'px';pop.style.left=Math.max(m,left)+'px'}
    function shareItems(){return [].slice.call(pop.querySelectorAll('[role=menuitem]'))}
    function closePop(focus){if(!cur)return;pop.hidden=true;cur.setAttribute('aria-expanded','false');if(focus)cur.focus();cur=null}
    function openPop(btn){var u=sUrl(btn);
      pop.innerHTML='<p class="share-h">Share this page</p>'+items(u).map(function(it){return '<a role="menuitem" href="'+it[2].replace(/"/g,'&quot;')+'"'+(it[0]==='mail'?'':' target="_blank" rel="noopener noreferrer"')+'>'+IC[it[0]]+'<span>'+it[1]+'</span></a>'}).join('')+
        '<button type="button" role="menuitem" class="share-copy">'+IC.link+'<span>Copy link</span></button><span class="sr-only" aria-live="polite"></span>';
      cur=btn;btn.setAttribute('aria-expanded','true');btn.setAttribute('aria-controls','share-pop');pop.hidden=false;place();shareItems()[0].focus();
      shareItems().forEach(function(a){if(a.tagName==='A')a.addEventListener('click',function(){setTimeout(function(){closePop(false)},0)})});
      var cp=pop.querySelector('.share-copy');cp.addEventListener('click',function(){
        function done(){cp.classList.add('ok');cp.innerHTML=IC.ok+'<span>Link copied</span>';pop.querySelector('[aria-live]').textContent='Link copied to clipboard';setTimeout(function(){closePop(true)},1400)}
        function legacy(){var t=d.createElement('textarea');t.value=u;t.setAttribute('readonly','');t.style.cssText='position:fixed;top:0;left:0;opacity:0';b.appendChild(t);t.select();try{d.execCommand('copy');done()}catch(_){window.prompt('Copy this link:',u)}t.remove();cp.focus()}
        if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(u).then(done,legacy);else legacy()})}
    sbs.forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();
      if(navigator.share){navigator.share({title:sTitle,text:sText,url:sUrl(btn)}).catch(function(){});return}
      if(cur===btn)closePop(true);else{closePop(false);openPop(btn)}})});
    d.addEventListener('click',function(e){if(cur&&!pop.contains(e.target))closePop(false)});
    pop.addEventListener('keydown',function(e){var l=shareItems(),i=l.indexOf(d.activeElement);
      if(e.key==='Escape'){e.preventDefault();closePop(true)}
      else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();l[(i+(e.key==='ArrowDown'?1:-1)+l.length)%l.length].focus()}
      else if(e.key==='Home'||e.key==='End'){e.preventDefault();l[e.key==='Home'?0:l.length-1].focus()}
      else if(e.key==='Tab'){e.preventDefault();closePop(true)}});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&cur)closePop(true)});
    window.addEventListener('resize',place);window.addEventListener('scroll',place,{passive:true});
  }

  // Hero loops: muted autoplay only when motion is allowed; sources load lazily
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function startHeroLoops(){
    if(reduceMotion)return;
    d.querySelectorAll('video.hero-loop[data-src-mp4]').forEach(function(v){
      if(v.dataset.ready)return;
      if(v.dataset.srcWebm){var s=d.createElement('source');s.src=v.dataset.srcWebm;s.type='video/webm';v.appendChild(s)}
      var s=d.createElement('source');s.src=v.dataset.srcMp4;s.type='video/mp4';v.appendChild(s);
      v.dataset.ready='1';v.muted=true;v.defaultMuted=true;v.playsInline=true;
      var p=v.play();if(p&&p.catch)p.catch(function(){});
    });
  }
  if(!reduceMotion){
    if('requestIdleCallback' in window)requestIdleCallback(startHeroLoops,{timeout:1200});
    else window.addEventListener('load',startHeroLoops);
  }
  // Walkthrough lightbox (sound on — opened by a user click)
  var vbtns=[].slice.call(d.querySelectorAll('[data-open-video]'));
  if(vbtns.length){
    var vlb=d.createElement('div');vlb.className='vlb';vlb.setAttribute('role','dialog');vlb.setAttribute('aria-modal','true');vlb.setAttribute('aria-label','Villa walkthrough');
    vlb.innerHTML='<div class="vlb-frame"><video controls playsinline preload="metadata"></video><button class="vlb-close" type="button" aria-label="Close walkthrough">&times;</button></div>';
    b.appendChild(vlb);
    var vv=vlb.querySelector('video'),vc=vlb.querySelector('.vlb-close'),vlast=null;
    function vclose(){vlb.classList.remove('open');b.style.overflow='';vv.pause();vv.removeAttribute('src');vv.load();if(vlast)vlast.focus()}
    function vopen(src,title){vlast=d.activeElement;if(title)vlb.setAttribute('aria-label',title);vv.src=src;vlb.classList.add('open');b.style.overflow='hidden';var p=vv.play();if(p&&p.catch)p.catch(function(){});vc.focus()}
    vbtns.forEach(function(btn){btn.addEventListener('click',function(){vopen(btn.dataset.openVideo,btn.dataset.videoTitle||'')})});
    vc.onclick=vclose;
    vlb.addEventListener('click',function(e){if(e.target===vlb)vclose()});
    d.addEventListener('keydown',function(e){if(!vlb.classList.contains('open'))return;if(e.key==='Escape'){e.preventDefault();vclose()}if(e.key==='Tab'){e.preventDefault();vc.focus()}});
  }
  var y=d.getElementById('year');if(y)y.textContent=new Date().getFullYear();
})();
