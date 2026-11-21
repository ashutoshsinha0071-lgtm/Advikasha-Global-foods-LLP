/* Advikasha enquiry list + product search. Stores only product names in this browser. */
(function(){
  var KEY='advikasha-enquiry', list=[];
  try{list=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(list))list=[]}catch(e){list=[]}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(list))}catch(e){}render()}
  var fab=document.getElementById('enq-fab'),dr=document.getElementById('enq-drawer'),ul=document.getElementById('enq-items'),cnt=document.getElementById('enq-count');
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
  function render(){
    if(cnt)cnt.textContent=list.length;
    if(fab)fab.hidden=list.length===0;
    if(ul)ul.innerHTML=list.length?list.map(function(n,i){return '<li><span>'+esc(n)+'</span><button type="button" class="linkbtn" data-rm="'+i+'" aria-label="Remove '+esc(n)+'">Remove</button></li>'}).join(''):'<li class="muted">No products added yet.</li>';
    document.querySelectorAll('.add-enq').forEach(function(b){var on=list.indexOf(b.dataset.enq)>-1;b.setAttribute('aria-pressed',on);b.textContent=on?'✓ Added':(b.closest('.glist')?'+ Add':'+ Add to enquiry')});
    var pf=document.getElementById('f-products'),pw=document.getElementById('f-products-wrap');
    if(pf&&!pf.dataset.touched){pf.value=list.join('\n');if(pw)pw.hidden=list.length===0}
  }
  function open(o){if(!dr)return;dr.hidden=!o;document.body.classList.toggle('enq-open',o);if(o)dr.querySelector('.enq-close').focus();else if(fab)fab.focus()}
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('.add-enq');
    if(b){var n=b.dataset.enq,i=list.indexOf(n);if(i>-1)list.splice(i,1);else list.push(n);save();return}
    var r=ev.target.closest('[data-rm]');if(r){list.splice(+r.dataset.rm,1);save();return}
    if(ev.target.closest('#enq-fab')){open(true);return}
    if(ev.target.closest('.enq-close')||ev.target===dr){open(false);return}
    if(ev.target.closest('#enq-clear')){list=[];save();return}
  });
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&dr&&!dr.hidden)open(false)});
  var pf=document.getElementById('f-products');if(pf)pf.addEventListener('input',function(){pf.dataset.touched=1});
  render();

  /* product search + category filter */
  var q=document.getElementById('q'),qc=document.getElementById('qcat');
  if(q&&qc){
    var secs=[].slice.call(document.querySelectorAll('.pcat')),none=document.getElementById('qnone'),qn=document.getElementById('qcount');
    function norm(t){return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
    secs.forEach(function(s){s.querySelectorAll('.items>li,.glist>li').forEach(function(li){li._t=norm(li.textContent)})});
    function run(){
      var t=norm(q.value.trim()).split(/\s+/).filter(Boolean),c=qc.value,shown=0,active=t.length||c;
      secs.forEach(function(s){
        var vis=0,okc=!c||s.id===c;
        s.querySelectorAll('.items>li,.glist>li').forEach(function(li){var ok=okc&&t.every(function(w){return li._t.indexOf(w)>-1});li.hidden=!ok;if(ok)vis++});
        s.querySelectorAll('.ggroup').forEach(function(g){g.hidden=!g.querySelector('li:not([hidden])')});
        s.hidden=vis===0;shown+=vis;
      });
      document.querySelectorAll('.terms-band').forEach(function(b){b.hidden=!!active});
      if(none)none.hidden=shown>0;
      if(qn)qn.textContent=active?(shown+' matching '+(shown===1?'product':'products')):'';
      var u=new URL(location.href);if(c)u.searchParams.set('cat',c);else u.searchParams.delete('cat');history.replaceState(null,'',u);
    }
    function reset(){q.value='';qc.value='';run()}
    q.addEventListener('input',run);qc.addEventListener('change',function(){run();if(qc.value){var el=document.getElementById('pfilter');scrollTo({top:el.getBoundingClientRect().top+scrollY-70,behavior:'smooth'})}});
    document.getElementById('qclear').addEventListener('click',reset);
    document.getElementById('qreset').addEventListener('click',reset);
    var pc=new URLSearchParams(location.search).get('cat');if(pc&&document.getElementById(pc)){qc.value=pc;run()}
  }

  /* contact: send the same enquiry on WhatsApp */
  var wb=document.getElementById('f-wa'),form=document.getElementById('quote');
  if(wb&&form){wb.addEventListener('click',function(){
    function v(id){var el=document.getElementById(id);return el?el.value.trim():''}
    var lines=['Hello Advikasha, I would like a quotation.'];
    [['Name','f-name'],['Company','f-company'],['Buyer type','f-type'],['Category','f-line'],['Products','f-products'],['Quantity','f-qty'],['Packaging','f-pack'],['Delivery','f-dest'],['Requirement','f-msg']].forEach(function(p){var x=v(p[1]);if(x&&x!=='Not sure yet')lines.push(p[0]+': '+x)});
    window.open('https://wa.me/'+wb.dataset.wa+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener');
  })}
})();
