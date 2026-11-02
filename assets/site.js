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
  var y=d.getElementById('year');if(y)y.textContent=new Date().getFullYear();
})();
