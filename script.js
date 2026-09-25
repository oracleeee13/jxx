(function(){
  var loader=document.getElementById("loadingScreen");
  if(!loader) return;
  var minTime=650, start=Date.now(), hidden=false;
  function hide(){
    if(hidden) return;
    hidden=true;
    var wait=Math.max(0,minTime-(Date.now()-start));
    setTimeout(function(){loader.classList.add("hide");},wait);
  }
  if(document.readyState==="complete"){hide();}
  else{window.addEventListener("load",hide);}
  setTimeout(hide,4000);
})();

(function(){
  var PIN="250204", LEN=PIN.length, entered="", locked=false, wrongCount=0;
  var dots=document.getElementById("dots"), pad=document.getElementById("pad"),
      hint=document.getElementById("hint"), gate=document.getElementById("gate"),
      stage=document.getElementById("stage"), wrongTimer=null;

  for(var i=0;i<LEN;i++){var d=document.createElement("span");d.className="dot";dots.appendChild(d);}

  var keys=["1","2","3","4","5","6","7","8","9","","0","del"];
  keys.forEach(function(k){
    if(k===""){var s=document.createElement("span");s.className="key spacer";pad.appendChild(s);return;}
    var b=document.createElement("button");
    b.type="button";b.className="key"+(k==="del"?" del":"");
    b.dataset.k=k;
    b.textContent=k==="del"?"\u232B":k;
    b.setAttribute("aria-label",k==="del"?"Delete":k);
    b.addEventListener("click",function(){press(k);});
    pad.appendChild(b);
  });

  function render(){
    var ds=dots.children;
    for(var i=0;i<LEN;i++) ds[i].classList.toggle("on",i<entered.length);
  }
  function setHint(t,err){hint.textContent=t;hint.classList.toggle("err",!!err);}

  function press(k){
    if(locked) return;
    if(k==="del"){entered=entered.slice(0,-1);render();return;}
    if(entered.length>=LEN) return;
    entered+=k;render();
    if(entered.length===LEN) check();
  }

  function check(){
    locked=true;
    setTimeout(function(){
      if(entered===PIN){
        wrongCount=0;
        clearTimeout(wrongTimer);stage.classList.remove("wrong");
        setHint("PIN correct");
        gate.classList.add("out");
        setTimeout(function(){document.dispatchEvent(new Event("pin:ok"));},800);
      }else{
        wrongCount++;
        stage.setAttribute("data-n",wrongCount>=2?"2":"1");
        setHint("Wrong PIN, try again",true);
        stage.classList.remove("wrong");void stage.offsetWidth;stage.classList.add("wrong");
        clearTimeout(wrongTimer);wrongTimer=setTimeout(function(){stage.classList.remove("wrong");},3500);
        dots.classList.remove("shake");void dots.offsetWidth;dots.classList.add("shake");
        setTimeout(function(){entered="";render();locked=false;setHint("Enter the 6-digit PIN");},600);
      }
    },180);
  }

  document.addEventListener("keydown",function(e){
    if(e.key>="0"&&e.key<="9"&&e.key.length===1){
      var b=pad.querySelector('[data-k="'+e.key+'"]');
      if(b){b.classList.add("press");setTimeout(function(){b.classList.remove("press");},120);}
      press(e.key);
    }else if(e.key==="Backspace"){press("del");}
  });
})();

(function(){
  var card=document.getElementById("card"), gate=document.getElementById("gate"), gift=document.getElementById("gift"),
      wish=document.getElementById("wish"), stars=document.getElementById("stars"),
      cv=document.getElementById("confetti"), ctx=cv.getContext("2d"),
      reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      dpr=Math.min(window.devicePixelRatio||1,2),
      opened=false, parts=[], raf=0,
      colors=["#ff7eb9","#ffb3d9","#ff4fa3","#ffffff","#ffd6ea"];

  // pecah teks jadi huruf-huruf agar muncul satu per satu
  var n=0;
  wish.querySelectorAll("[data-t]").forEach(function(el){
    el.dataset.t.split("").forEach(function(c){
      var s=document.createElement("span");
      s.setAttribute("aria-hidden","true");
      if(c===" "){s.className="sp";}
      else{s.className="ch";s.textContent=c;s.style.setProperty("--i",n++);}
      el.appendChild(s);
    });
  });

  // bintang kecil di latar
  for(var i=0;i<18;i++){
    var st=document.createElement("i");
    st.className="star";
    st.style.cssText="left:"+Math.random()*100+"%;top:"+Math.random()*100+"%;"+
      "--s:"+(1+Math.random()*2.2)+"px;--c:"+(Math.random()<.35?"#fff":"#ff7eb9")+";"+
      "--d:"+(2.5+Math.random()*3)+"s;--dl:-"+Math.random()*4+"s";
    stars.appendChild(st);
  }

  // confetti
  function size(){cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;}
  size();addEventListener("resize",size);

  function burst(count,el){
    var r=(el||gift).getBoundingClientRect(), x=(r.left+r.width/2)*dpr, y=(r.top+r.height*.3)*dpr;
    for(var i=0;i<count;i++){
      var a=-Math.PI/2+(Math.random()-.5)*Math.PI*1.1, v=(6+Math.random()*10)*dpr;
      parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
        w:(5+Math.random()*6)*dpr,h:(3+Math.random()*4)*dpr,
        r:Math.random()*6.28,vr:(Math.random()-.5)*.4,c:colors[i%colors.length],life:1});
    }
    if(!raf) raf=requestAnimationFrame(tick);
  }

  function tick(){
    ctx.clearRect(0,0,cv.width,cv.height);
    parts=parts.filter(function(p){
      p.vy+=.28*dpr;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life-=.007;
      if(p.life<=0||p.y>cv.height+40) return false;
      ctx.save();
      ctx.globalAlpha=Math.min(1,p.life*2);
      ctx.translate(p.x,p.y);ctx.rotate(p.r);
      ctx.scale(1,Math.abs(Math.sin(p.r*1.7))*.8+.2);
      ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
      return true;
    });
    raf=parts.length?requestAnimationFrame(tick):0;
    if(!raf) ctx.clearRect(0,0,cv.width,cv.height);
  }

  gift.addEventListener("click",function(){
    if(opened){if(!reduce) burst(50);return;}
    opened=true;
    card.classList.add("open");
    wish.setAttribute("aria-hidden","false");
    gift.setAttribute("aria-label","Gift already opened");
    if(!reduce){
      setTimeout(function(){burst(110);},250);
      setTimeout(function(){burst(70);},700);
    }
  });


  // ===== game tiup lilin =====
  var scene=document.getElementById("cakeScene"), wrap=document.getElementById("cakeWrap"),
      candles=[].slice.call(scene.querySelectorAll(".candle")), N=candles.length,
      micBtn=document.getElementById("micBtn"), holdBtn=document.getElementById("holdBtn"),
      againBtn=document.getElementById("again"), fill=document.getElementById("meterFill"),
      msg=document.getElementById("status"), more=document.getElementById("more"),
      order=[2,1,3,0,4].filter(function(x){return x<N;}), T=.55,
      energy=0, out=0, level=0, micLvl=0, holdLvl=0, holding=false, finished=false,
      micOn=false, actx=null, an=null, data=null, stream=null, base=0, calUntil=0, gLoop=0, last=0,
      // Naikkan angka ini kalau masih kurang peka, turunkan kalau terlalu sensitif ke suara ambient.
      MIC_GAIN=6, MIC_NOISE_MULT=1.2, MIC_OFFSET=.008, MIC_RANGE=.10;

  function setMsg(t){msg.textContent=t;}
  function updateGlow(){wrap.style.setProperty("--lit",(N-out)/N);}
  function ensureLoop(){if(!gLoop){last=performance.now();gLoop=requestAnimationFrame(frame);}}

  // muncul saat di-scroll: lilin menyala satu per satu
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){scene.classList.add("seen");io.disconnect();}});
    },{threshold:.35});
    io.observe(scene);
  }else{scene.classList.add("seen");}

  more.addEventListener("click",function(){
    scene.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  });

  // membaca kekuatan tiupan dari mikrofon
  function readMic(now){
    if(!an) return 0;
    an.getByteTimeDomainData(data);
    var sum=0;
    for(var k=0;k<data.length;k++){var v=(data[k]-128)/128;sum+=v*v;}
    var rms=Math.sqrt(sum/data.length);
    if(now<calUntil){base=base?base*.9+rms*.1:rms;return 0;}
    return Math.max(0,Math.min(1,(rms-base*MIC_NOISE_MULT-MIC_OFFSET)/MIC_RANGE));
  }

  function snuff(idx){
    candles[idx].classList.add("out");
    out++;updateGlow();
  }

  function win(){
    finished=true;stopMic();
    scene.classList.add("done");
    setMsg("May all your wishes come true.");
    if(!reduce){burst(120,wrap);setTimeout(function(){burst(80,wrap);},450);}
  }

  function frame(now){
    var dt=Math.min(.05,(now-last)/1000);last=now;
    micLvl+=(readMic(now)-micLvl)*.4;
    holdLvl+=((holding?1:0)-holdLvl)*Math.min(1,dt*(holding?6:10));
    level=Math.max(micLvl,holdLvl);
    fill.style.transform="scaleX("+level.toFixed(3)+")";
    if(!finished){
      if(level>.09) energy+=level*dt; else energy=Math.max(out*T,energy-.12*dt);
      candles.forEach(function(c,i){
        if(c.classList.contains("out")) return;
        var dir=i%2?1:-1, lean=level>.06?dir*(level*18+Math.random()*level*14):0;
        c.style.setProperty("--lean",lean.toFixed(1)+"deg");
        c.style.setProperty("--sc",(1-level*.3).toFixed(2));
      });
      while(out<N&&energy>=(out+1)*T) snuff(order[out]);
      if(out>=N) win();
    }
    if(micOn||holding||level>.02||holdLvl>.02){gLoop=requestAnimationFrame(frame);}
    else{
      gLoop=0;
      candles.forEach(function(c){c.style.setProperty("--lean","0deg");c.style.setProperty("--sc","1");});
    }
  }

  function startMic(){
    if(micOn) return;
    var md=navigator.mediaDevices;
    if(!md||!md.getUserMedia){setMsg("Mic isn’t available on this device. Use the “Hold to blow” button.");return;}
    md.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(s){
      var AC=window.AudioContext||window.webkitAudioContext;
      stream=s;actx=new AC();
      if(actx.resume) actx.resume();
      var src=actx.createMediaStreamSource(s);
      var gainNode=actx.createGain();gainNode.gain.value=MIC_GAIN;
      an=actx.createAnalyser();an.fftSize=1024;
      data=new Uint8Array(an.fftSize);
      src.connect(gainNode);gainNode.connect(an);
      micOn=true;base=0;calUntil=performance.now()+700;
      micBtn.textContent="Mic active";micBtn.disabled=true;
      setMsg("Hold on, the mic is calibrating…");
      setTimeout(function(){if(micOn&&!finished) setMsg("Now blow toward the mic!");},750);
      ensureLoop();
    }).catch(function(){
      setMsg("Mic access denied. Use the “Hold to blow” button.");
    });
  }

  function stopMic(){
    if(stream) stream.getTracks().forEach(function(t){t.stop();});
    if(actx&&actx.close) actx.close();
    stream=null;actx=null;an=null;micOn=false;micLvl=0;
    micBtn.textContent="Blow via mic";micBtn.disabled=false;
  }

  function hold(v){
    holding=v;holdBtn.classList.toggle("on",v);
    if(v&&!finished) ensureLoop();
  }
  micBtn.addEventListener("click",startMic);
  holdBtn.addEventListener("pointerdown",function(e){
    e.preventDefault();hold(true);
    try{holdBtn.setPointerCapture(e.pointerId);}catch(x){}
  });
  ["pointerup","pointercancel","lostpointercapture","blur"].forEach(function(ev){
    holdBtn.addEventListener(ev,function(){hold(false);});
  });
  holdBtn.addEventListener("keydown",function(e){
    if(e.key===" "||e.key==="Enter"){e.preventDefault();if(!e.repeat) hold(true);}
  });
  holdBtn.addEventListener("keyup",function(e){
    if(e.key===" "||e.key==="Enter") hold(false);
  });
  holdBtn.addEventListener("contextmenu",function(e){e.preventDefault();});

  againBtn.addEventListener("click",function(){
    finished=false;energy=0;out=0;level=0;holdLvl=0;
    candles.forEach(function(c){c.classList.remove("out");c.style.setProperty("--lean","0deg");c.style.setProperty("--sc","1");});
    scene.classList.remove("done");updateGlow();
    setMsg("Make a wish, then blow out the candles.");
  });

  // ===== surat cinta =====
  (function(){
    var lscene=document.getElementById("letterScene");
    if(!lscene) return;
    var paras=[].slice.call(lscene.querySelectorAll(".ltr"));
    paras.forEach(function(p,i){p.style.setProperty("--i",i);});
    lscene.style.setProperty("--pcount",paras.length);

    var hearts=document.getElementById("lhearts");
    if(hearts){
      for(var i=0;i<9;i++){
        var h=document.createElement("span");
        h.className="lh";h.textContent="\u2764";
        h.style.left=(6+Math.random()*88)+"%";
        h.style.setProperty("--s",(9+Math.random()*11)+"px");
        h.style.setProperty("--d",(6+Math.random()*5)+"s");
        h.style.setProperty("--dl","-"+(Math.random()*7).toFixed(2)+"s");
        hearts.appendChild(h);
      }
    }

    if("IntersectionObserver" in window){
      var lio=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting){lscene.classList.add("seen");lio.disconnect();}});
      },{threshold:.25});
      lio.observe(lscene);
    }else{lscene.classList.add("seen");}

    var toLetter=document.getElementById("toLetter");
    if(toLetter){
      toLetter.addEventListener("click",function(){
        lscene.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
      });
    }
  })();

  // ===== kucing bawa bunga =====
  (function(){
    var cscene=document.getElementById("catScene");
    if(!cscene) return;

    var flowers=document.getElementById("catFlowers"), fEmoji=["\u2740","\uD83C\uDF38","\u273F"];
    if(flowers){
      for(var i=0;i<12;i++){
        var f=document.createElement("span");
        f.className="cf";f.textContent=fEmoji[i%fEmoji.length];
        f.style.left=(Math.random()*100)+"%";
        f.style.setProperty("--s",(12+Math.random()*14)+"px");
        f.style.setProperty("--d",(5+Math.random()*4)+"s");
        f.style.setProperty("--dl","-"+(Math.random()*7).toFixed(2)+"s");
        f.style.setProperty("--x",(Math.random()*60-30).toFixed(0)+"px");
        flowers.appendChild(f);
      }
    }

    if("IntersectionObserver" in window){
      var cio=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting){cscene.classList.add("seen");cio.disconnect();}});
      },{threshold:.3});
      cio.observe(cscene);
    }else{cscene.classList.add("seen");}

    var toCat=document.getElementById("toCat");
    if(toCat){
      toCat.addEventListener("click",function(){
        cscene.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
      });
    }

    var catBtn=document.getElementById("cat3Btn"), stage=document.getElementById("cat3Stage"),
        ummPop=document.getElementById("ummPop"), bubble3=document.getElementById("bubble3"),
        kissOverlay=document.getElementById("kissOverlay"), kissField=document.getElementById("kissField"),
        kissClosing=document.getElementById("kissClosing"), replayBtn=document.getElementById("replayBtn"),
        kissTimer=null, kissSpawned=0;

    var isSmallScreen=window.matchMedia&&window.matchMedia("(max-width:600px)").matches,
        isCoarsePointer=window.matchMedia&&window.matchMedia("(pointer:coarse)").matches,
        isMobileKiss=isSmallScreen||isCoarsePointer,
        kissBreatheEvery=isMobileKiss?3:1; // di HP, hanya 1 dari 3 gambar yang terus "bernapas" (animasi infinite)

    function spawnKiss(idx){
      var img=document.createElement("img");
      img.className="kiss-img";img.src="kiss.png";img.alt="";
      img.style.setProperty("--x",(Math.random()*100)+"%");
      img.style.setProperty("--y",(Math.random()*100)+"%");
      img.style.setProperty("--s",(56+Math.random()*84)+"px");
      img.style.setProperty("--r",(Math.random()*54-27).toFixed(0)+"deg");
      if(idx%kissBreatheEvery!==0) img.style.animation="none"; // matikan animasi infinite utk sebagian besar elemen di HP
      kissField.appendChild(img);
      requestAnimationFrame(function(){requestAnimationFrame(function(){img.classList.add("in");});});
    }

    function showClosing(){
      setTimeout(function(){
        if(kissClosing) kissClosing.classList.add("show");
      },reduce?0:500);
    }

    function startKissRain(){
      if(!kissField||kissTimer) return;
      var target=isMobileKiss?70:160, perTick=isMobileKiss?1:2, tickMs=isMobileKiss?45:35;
      if(reduce){
        for(kissSpawned=0;kissSpawned<target;kissSpawned++) spawnKiss(kissSpawned);
        showClosing();
        return;
      }
      kissTimer=setInterval(function(){
        for(var i=0;i<perTick;i++) spawnKiss(kissSpawned+i);
        kissSpawned+=perTick;
        if(kissSpawned>=target){clearInterval(kissTimer);kissTimer=null;showClosing();}
      },tickMs);
    }

    if(catBtn){
      catBtn.addEventListener("click",function(){
        if(catBtn.classList.contains("tapped")) return;
        catBtn.classList.remove("poke");void catBtn.offsetWidth;catBtn.classList.add("poke");
        if(!reduce) burst(26,catBtn);
        setTimeout(function(){
          catBtn.classList.add("tapped");
          if(stage) stage.classList.add("swapped");
          if(bubble3) bubble3.classList.add("hide");
          if(ummPop) ummPop.classList.add("show");
          setTimeout(function(){
            if(stage) stage.classList.add("gone");
            if(ummPop) ummPop.classList.remove("show");
            setTimeout(function(){
              if(kissOverlay) kissOverlay.classList.add("show");
              startKissRain();
            },reduce?0:400);
          },1000);
        },reduce?0:160);
      });
    }

    if(replayBtn){
      replayBtn.addEventListener("click",function(){
        if(kissClosing) kissClosing.classList.remove("show");
        if(kissOverlay) kissOverlay.classList.remove("show");
        if(kissTimer){clearInterval(kissTimer);kissTimer=null;}
        if(kissField) kissField.innerHTML="";
        kissSpawned=0;
        if(stage) stage.classList.remove("swapped","gone");
        if(catBtn) catBtn.classList.remove("tapped","poke");
        if(bubble3) bubble3.classList.remove("hide");
        if(ummPop) ummPop.classList.remove("show");
        if(typeof againBtn!=="undefined"&&againBtn) againBtn.click();
        if(typeof opened!=="undefined") opened=false;
        if(typeof card!=="undefined"&&card) card.classList.remove("open");
        if(typeof gift!=="undefined"&&gift) gift.setAttribute("aria-label","Open the gift");
        if(typeof card!=="undefined"&&card){
          card.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
        }
      });
    }
  })();

  // tampilkan kartu setelah PIN benar
  document.addEventListener("pin:ok",function(){
    gate.style.display="none";
    card.style.display="block";
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      card.classList.add("in");document.body.classList.add("unlocked");
    });});
  });
})();
