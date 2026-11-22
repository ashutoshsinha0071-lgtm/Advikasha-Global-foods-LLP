/* Advikasha: enquiry list with quantities, header search, catalogue filters, form validation.
   Stores only product names and quantities in this browser (localStorage). */
(function(){
  'use strict';
  var KEY='advikasha-enquiry', list=[];
  var UNITS={kg:{min:5,step:5,label:'kg'},tonne:{min:1,step:1,label:'tonne'}};
  function esc(t){var d=document.createElement('div');d.textContent=t==null?'':String(t);return d.innerHTML}
  function norm(t){return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
  function load(){
    var raw=[];try{raw=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
    if(!Array.isArray(raw))raw=[];
    /* older versions stored plain product names */
    list=raw.map(function(x){return typeof x==='string'?{n:x,q:null,u:'kg'}:x}).filter(function(x){return x&&x.n});
  }
  load();
  function find(n){for(var i=0;i<list.length;i++)if(list[i].n===n)return i;return -1}
  function qtyText(x){if(x.q==null||x.q==='')return '';return x.q+' '+(UNITS[x.u]?UNITS[x.u].label:x.u)+(x.u==='tonne'&&+x.q>1?'s':'')}
  function line(x){var q=qtyText(x);return x.n+(q?' — '+q:'')}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(list))}catch(e){}render()}

  var dr=document.getElementById('enq-drawer'),ul=document.getElementById('enq-items'),fab=document.getElementById('enq-fab');

  function stepper(x,i){
    if(x.q==null)return '<span class="muted small">Quantity discussed per project</span>';
    var opts=Object.keys(UNITS).map(function(k){return '<option value="'+k+'"'+(x.u===k?' selected':'')+'>'+UNITS[k].label+'</option>'}).join('');
    return '<div class="qty" data-i="'+i+'"><div class="stepper"><button type="button" class="step" data-d="-1" aria-label="Decrease quantity">−</button><input type="number" inputmode="numeric" value="'+esc(x.q)+'" min="'+UNITS[x.u].min+'" step="'+UNITS[x.u].step+'" aria-label="Quantity for '+esc(x.n)+'"><button type="button" class="step" data-d="1" aria-label="Increase quantity">+</button></div><select aria-label="Unit for '+esc(x.n)+'">'+opts+'</select></div>';
  }

  function render(){
    document.querySelectorAll('[data-enq-count],#enq-count').forEach(function(c){c.textContent=list.length});
    document.querySelectorAll('.enq-open').forEach(function(b){b.classList.toggle('has-items',list.length>0);b.setAttribute('aria-label','My enquiry, '+list.length+(list.length===1?' item':' items'))});
    if(fab)fab.hidden=list.length===0;
    if(ul){
      ul.innerHTML=list.length?list.map(function(x,i){return '<li><div class="ei-top"><span class="ei-name">'+esc(x.n)+'</span><button type="button" class="linkbtn" data-rm="'+i+'" aria-label="Remove '+esc(x.n)+'">Remove</button></div>'+stepper(x,i)+'</li>'}).join(''):'<li class="ei-empty muted">No products added yet. Use “Add to enquiry” on any product.</li>';
    }
    var acts=document.querySelectorAll('.enq-needs-items');acts.forEach(function(a){a.toggleAttribute('hidden',list.length===0)});
    document.querySelectorAll('.add-enq').forEach(function(b){
      var on=find(b.dataset.enq)>-1;b.setAttribute('aria-pressed',on);
      var short=b.closest('.glist');
      b.innerHTML=on?'<span aria-hidden="true">✓</span> '+(short?'Added':'In your enquiry'):'<span aria-hidden="true">+</span> '+(short?'Add':'Add to enquiry');
      b.title=on?'Click to remove from your enquiry':'';
    });
    var pf=document.getElementById('f-products'),pw=document.getElementById('f-products-wrap');
    if(pf&&!pf.dataset.touched){pf.value=list.map(line).join('\n');if(pw)pw.hidden=list.length===0}
    var wa=document.getElementById('enq-wa');
    if(wa){var msg=['Hello Advikasha, please quote for:'].concat(list.map(function(x){return '• '+line(x)})).concat(['Delivery city/country: ']);wa.href='https://wa.me/917291940154?text='+encodeURIComponent(msg.join('\n'))}
  }

  function cardQty(el){
    var box=el&&el.querySelector('.pc-qty');if(!box)return null;
    var inp=box.querySelector('input'),sel=box.querySelector('select');
    var u=sel?sel.value:'kg',q=parseFloat(inp.value);
    if(!(q>0))q=UNITS[u].min;
    return {q:q,u:u};
  }
  function clamp(inp,u){var m=UNITS[u]||UNITS.kg,v=parseFloat(inp.value);if(!(v>=m.min))v=m.min;inp.value=v;inp.min=m.min;inp.step=m.step;return v}

  var lastFocus=null;
  function open(o){
    if(!dr)return;dr.hidden=!o;document.body.classList.toggle('enq-open',o);
    if(o){lastFocus=document.activeElement;var c=dr.querySelector('.enq-close');if(c)c.focus()}
    else if(lastFocus&&lastFocus.focus)lastFocus.focus();
  }

  document.addEventListener('click',function(ev){
    var t=ev.target;
    var st=t.closest('.step');
    if(st){
      var box=st.closest('.qty,.pc-qty'),inp=box.querySelector('input'),sel=box.querySelector('select'),u=sel?sel.value:'kg',m=UNITS[u];
      var v=(parseFloat(inp.value)||m.min)+(+st.dataset.d)*m.step;if(v<m.min)v=m.min;inp.value=v;
      inp.dispatchEvent(new Event('change',{bubbles:true}));return;
    }
    var b=t.closest('.add-enq');
    if(b){
      var n=b.dataset.enq,i=find(n);
      if(i>-1){list.splice(i,1)}
      else{
        var card=b.closest('.item,.pcard,li,.side-card');
        var q=cardQty(card);
        if(!q&&b.dataset.pl==null)q={q:UNITS.kg.min,u:'kg'};
        list.push({n:n,q:q?q.q:null,u:q?q.u:'kg'});
        toast(n);
      }
      save();return;
    }
    var r=t.closest('[data-rm]');if(r){list.splice(+r.dataset.rm,1);save();return}
    if(t.closest('.enq-open')||t.closest('#enq-fab')){ev.preventDefault();open(true);return}
    if(t.closest('.enq-close')||t===dr){open(false);return}
    if(t.closest('#enq-clear')){if(list.length){list=[];save()}return}
  });
  document.addEventListener('change',function(ev){
    var t=ev.target,box=t.closest('.qty');
    if(box){
      var x=list[+box.dataset.i];if(!x)return;
      var inp=box.querySelector('input'),sel=box.querySelector('select');
      if(t===sel){x.u=sel.value;x.q=UNITS[x.u].min}
      else x.q=clamp(inp,x.u);
      save();return;
    }
    var pb=t.closest('.pc-qty');
    if(pb){
      var inp2=pb.querySelector('input'),sel2=pb.querySelector('select'),u2=sel2?sel2.value:'kg';
      if(t===sel2)inp2.value=UNITS[u2].min;
      clamp(inp2,u2);
      var card=pb.closest('.item,.pcard,li'),btn=card&&card.querySelector('.add-enq');
      if(btn){var k=find(btn.dataset.enq);if(k>-1){list[k].q=parseFloat(inp2.value);list[k].u=u2;save()}}
    }
  });
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&dr&&!dr.hidden)open(false)});
  var pf=document.getElementById('f-products');if(pf)pf.addEventListener('input',function(){pf.dataset.touched=1});

  /* small confirmation when an item is added */
  var tw=null;
  function toast(n){
    if(!tw){tw=document.createElement('div');tw.className='enq-toast';tw.setAttribute('role','status');tw.setAttribute('aria-live','polite');document.body.appendChild(tw)}
    tw.innerHTML='<span>Added: <strong>'+esc(n)+'</strong></span><button type="button" class="linkbtn enq-open">Review enquiry</button>';
    tw.classList.add('show');clearTimeout(tw._t);tw._t=setTimeout(function(){tw.classList.remove('show')},3800);
  }
  render();
  window.addEventListener('storage',function(e){if(e.key===KEY){load();render()}});

  /* ---------- catalogue: search, sidebar, category filter ---------- */
  var q=document.getElementById('q'),qc=document.getElementById('qcat');
  if(q&&qc){
    var secs=[].slice.call(document.querySelectorAll('.pcat')),none=document.getElementById('qnone'),qn=document.getElementById('qcount');
    var side=[].slice.call(document.querySelectorAll('[data-fcat]'));
    secs.forEach(function(s){s.querySelectorAll('.items>li,.glist>li').forEach(function(li){li._t=norm(li.textContent+' '+(li.id||'').replace('item-','item '))})});
    function run(){
      var raw=q.value.trim(),t=norm(raw).split(/\s+/).filter(Boolean),c=qc.value,shown=0,active=t.length||c;
      /* a bare number finds that item number */
      var num=/^\d{1,3}$/.test(raw)?raw:null;
      secs.forEach(function(s){
        var vis=0,okc=!c||s.id===c;
        s.querySelectorAll('.items>li,.glist>li').forEach(function(li){
          var ok=okc&&(num?(li.id==='item-'+num):t.every(function(w){return li._t.indexOf(w)>-1}));
          li.hidden=!ok;if(ok)vis++;
        });
        s.querySelectorAll('.ggroup').forEach(function(g){g.hidden=!g.querySelector('li:not([hidden])')});
        s.hidden=vis===0;shown+=vis;
      });
      document.querySelectorAll('.terms-band').forEach(function(b){b.hidden=!!active});
      if(none)none.hidden=shown>0;
      if(qn)qn.textContent=active?(shown+' matching '+(shown===1?'product':'products')):'';
      side.forEach(function(a){var on=(a.dataset.fcat||'')===c;a.setAttribute('aria-pressed',on);a.classList.toggle('is-active',on)});
      var u=new URL(location.href);
      if(c)u.searchParams.set('cat',c);else u.searchParams.delete('cat');
      if(raw)u.searchParams.set('q',raw);else u.searchParams.delete('q');
      history.replaceState(null,'',u);
    }
    function top(){var el=document.getElementById('catalogue')||document.getElementById('pfilter');if(el)scrollTo({top:el.getBoundingClientRect().top+scrollY-130,behavior:'smooth'})}
    function reset(){q.value='';qc.value='';run()}
    q.addEventListener('input',run);
    qc.addEventListener('change',function(){run();top()});
    side.forEach(function(a){a.addEventListener('click',function(ev){ev.preventDefault();qc.value=a.dataset.fcat||'';run();top()})});
    var qcl=document.getElementById('qclear');if(qcl)qcl.addEventListener('click',reset);
    var qr=document.getElementById('qreset');if(qr)qr.addEventListener('click',reset);
    var P=new URLSearchParams(location.search),pc=P.get('cat'),pq=P.get('q');
    if(pc&&document.getElementById(pc))qc.value=pc;
    if(pq)q.value=pq;
    if(pc||pq){run();if(pq||pc)setTimeout(top,60)}
    else run();
    window.__advCatalogue={setQuery:function(v){q.value=v;qc.value='';run();top()}};
  }

  /* ---------- contact form: inline validation + WhatsApp ---------- */
  var form=document.getElementById('quote');
  if(form){
    form.setAttribute('novalidate','');
    var summary=document.createElement('div');summary.className='form-errors';summary.setAttribute('role','alert');summary.hidden=true;form.insertBefore(summary,form.firstChild.nextSibling);
    function msgFor(el){
      if(el.validity.valueMissing)return 'Please fill in '+(el.labels&&el.labels[0]?el.labels[0].childNodes[0].textContent.trim().toLowerCase():'this field')+'.';
      if(el.validity.typeMismatch&&el.type==='email')return 'Please enter a valid email address, e.g. name@company.com.';
      return '';
    }
    function check(el){
      var f=el.closest('.field');if(!f)return true;
      var m=msgFor(el),err=f.querySelector('.err');
      if(m){if(!err){err=document.createElement('p');err.className='err';err.id=el.id+'-err';f.appendChild(err)}err.textContent=m;el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',err.id);f.classList.add('has-err');return false}
      if(err)err.remove();el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby');f.classList.remove('has-err');return true;
    }
    [].forEach.call(form.querySelectorAll('input[required],textarea[required],input[type=email]'),function(el){
      el.addEventListener('blur',function(){if(el.value||el.closest('.has-err'))check(el)});
      el.addEventListener('input',function(){if(el.closest('.has-err'))check(el)});
    });
    form.addEventListener('submit',function(ev){
      var bad=[].filter.call(form.querySelectorAll('input[required],textarea[required],input[type=email]'),function(el){return !check(el)});
      if(bad.length){
        ev.preventDefault();
        summary.hidden=false;
        summary.innerHTML='<strong>Please check '+bad.length+(bad.length===1?' field':' fields')+'.</strong> '+bad.map(function(el){return '<a href="#'+el.id+'">'+esc(el.labels[0].childNodes[0].textContent.trim())+'</a>'}).join(', ');
        bad[0].focus();return;
      }
      summary.hidden=true;
      var sb=form.querySelector('button[type=submit]');if(sb){sb.disabled=true;sb.dataset.label=sb.textContent;sb.textContent='Sending…'}
    });
    var wb=document.getElementById('f-wa');
    if(wb){wb.addEventListener('click',function(){
      function v(id){var el=document.getElementById(id);return el?el.value.trim():''}
      var lines=['Hello Advikasha, I would like a quotation.'];
      [['Name','f-name'],['Company','f-company'],['Buyer type','f-type'],['Category','f-line'],['Products','f-products'],['Quantity','f-qty'],['Packaging','f-pack'],['Delivery','f-dest'],['Requirement','f-msg']].forEach(function(p){var x=v(p[1]);if(x&&x!=='Not sure yet')lines.push(p[0]+': '+x)});
      window.open('https://wa.me/'+wb.dataset.wa+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener');
    })}
  }
})();

/* ---------- menus, header search, search overlay, enquiry type ---------- */
(function(){
  'use strict';
  document.querySelectorAll('.dd-btn').forEach(function(b){
    var li=b.closest('.has-dd');
    b.addEventListener('click',function(ev){ev.stopPropagation();var o=!li.classList.contains('dd-open');document.querySelectorAll('.has-dd.dd-open').forEach(function(x){if(x!==li){x.classList.remove('dd-open');x.querySelector('.dd-btn').setAttribute('aria-expanded',false)}});li.classList.toggle('dd-open',o);b.setAttribute('aria-expanded',o)});
    document.addEventListener('click',function(ev){if(!li.contains(ev.target)){li.classList.remove('dd-open');b.setAttribute('aria-expanded',false)}});
    li.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&li.classList.contains('dd-open')){li.classList.remove('dd-open');b.setAttribute('aria-expanded',false);b.focus()}});
  });

  var idx=null;
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
  function norm(t){return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
  function loadIdx(){if(idx)return Promise.resolve(idx);return fetch('/search.json').then(function(r){return r.json()}).then(function(d){d.forEach(function(x){x.n=norm(x.t+' '+x.c+' '+x.k);x.h=norm(x.t)});idx=d;return d})}
  function search(q){
    q=norm(q.trim());if(!q)return Promise.resolve([]);
    return loadIdx().then(function(d){
      var w=q.split(/\s+/),num=/^\d{1,3}$/.test(q)?q:null;
      var hits=d.filter(function(x){return num?(new RegExp('\\bitem '+num+'\\b').test(x.n)||x.n.indexOf(q)>-1):w.every(function(t){return x.n.indexOf(t)>-1})});
      hits.sort(function(a,b){var sa=(a.h.indexOf(w[0])>-1?0:1)+(a.c==="Buyer's guide"?.5:0),sb=(b.h.indexOf(w[0])>-1?0:1)+(b.c==="Buyer's guide"?.5:0);return sa-sb});
      return hits;
    });
  }
  function rows(hits){return hits.length?hits.slice(0,8).map(function(x,i){return '<li role="option" id="hopt-'+i+'"><a href="'+x.u+'"><strong>'+esc(x.t)+'</strong><span>'+esc(x.c)+'</span></a></li>'}).join(''):'<li class="muted none">No matches. Try another word, or <a href="/contact#quote">ask us directly</a>.</li>'}

  /* header search with suggestions */
  var hf=document.querySelector('.hdr-search'),hq=document.getElementById('hq'),hr=document.getElementById('hres'),sel=-1;
  if(hf&&hq&&hr){
    function show(o){hr.hidden=!o;hq.setAttribute('aria-expanded',o)}
    function mark(){var o=hr.querySelectorAll('[role=option]');o.forEach(function(x,i){x.classList.toggle('is-sel',i===sel)});if(o[sel])hq.setAttribute('aria-activedescendant',o[sel].id);else hq.removeAttribute('aria-activedescendant')}
    hq.addEventListener('focus',function(){loadIdx()});
    hq.addEventListener('input',function(){
      var v=hq.value;sel=-1;
      if(!v.trim()){hr.innerHTML='';show(false);return}
      search(v).then(function(h){if(hq.value!==v)return;hr.innerHTML=rows(h)+(h.length?'<li class="all"><a href="/products?q='+encodeURIComponent(v.trim())+'">See all results in the catalogue →</a></li>':'');show(true)});
    });
    hq.addEventListener('keydown',function(ev){
      var o=hr.querySelectorAll('[role=option]');
      if(ev.key==='ArrowDown'&&o.length){ev.preventDefault();sel=Math.min(sel+1,o.length-1);mark()}
      else if(ev.key==='ArrowUp'&&o.length){ev.preventDefault();sel=Math.max(sel-1,-1);mark()}
      else if(ev.key==='Enter'&&sel>-1&&o[sel]){ev.preventDefault();location.href=o[sel].querySelector('a').getAttribute('href')}
      else if(ev.key==='Escape'){show(false)}
    });
    document.addEventListener('click',function(ev){if(!hf.contains(ev.target))show(false)});
    hf.addEventListener('submit',function(ev){
      var v=hq.value.trim();if(!v){ev.preventDefault();hq.focus();return}
      if(window.__advCatalogue){ev.preventDefault();show(false);window.__advCatalogue.setQuery(v)}
    });
  }

  /* search overlay (mobile) */
  var ov=document.getElementById('search-ov'),sq=document.getElementById('sq'),res=document.getElementById('sres'),last=null;
  function runOv(){var v=sq.value;if(!v.trim()){res.innerHTML='';return}search(v).then(function(h){if(sq.value===v)res.innerHTML=rows(h).replace(/ role="option" id="hopt-\d+"/g,'')})}
  function open(o){if(!ov)return;ov.hidden=!o;document.body.classList.toggle('enq-open',o);if(o){last=document.activeElement;loadIdx();setTimeout(function(){sq.focus()},10)}else if(last)last.focus()}
  document.querySelectorAll('.search-btn').forEach(function(b){b.addEventListener('click',function(){open(true)})});
  if(ov){
    ov.addEventListener('click',function(ev){if(ev.target===ov||ev.target.closest('.search-close'))open(false);if(ev.target.closest('.search-res a'))open(false)});
    sq.addEventListener('input',runOv);
    sq.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&sq.value.trim()){ev.preventDefault();open(false);if(window.__advCatalogue)window.__advCatalogue.setQuery(sq.value.trim());else location.href='/products?q='+encodeURIComponent(sq.value.trim())}});
    document.addEventListener('keydown',function(ev){
      if(ev.key==='Escape'&&!ov.hidden)open(false);
      if(ev.key==='/'&&ov.hidden&&!/input|textarea|select/i.test((document.activeElement||{}).tagName||'')){ev.preventDefault();if(hq&&getComputedStyle(hf).display!=='none')hq.focus();else open(true)}
    });
  }

  /* mobile menu opens directly under the header */
  var hdr=document.querySelector('.site-header');
  function setH(){if(!hdr)return;var r=document.documentElement.style;r.setProperty('--hdr-h',Math.max(0,hdr.getBoundingClientRect().bottom)+'px');r.setProperty('--hdr-hh',hdr.offsetHeight+'px')}
  document.querySelectorAll('.menu-btn').forEach(function(b){b.addEventListener('click',setH,true)});
  addEventListener('resize',setH,{passive:true});setH();

  var k=document.getElementById('f-kind'),t=new URLSearchParams(location.search).get('type');
  if(k&&t==='sample')k.value='Samples';
  var m=document.getElementById('f-msg');if(m&&t==='sample'&&!m.value)m.value='Sample request. Product: '+(new URLSearchParams(location.search).get('product')||'')+'\nDelivery address/city: ';
})();
