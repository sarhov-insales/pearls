//////////////////////////////////////////////////////////////////////////////////
// Cloud Zoom V1.0.2
// (c) 2010 by R Cecco. <http://www.professorcloud.com>
// MIT License
//
// Please retain this copyright header in all versions of the software
//////////////////////////////////////////////////////////////////////////////////
(function ($) {

    $(document).ready(function () {
        $('.cloud-zoom, .cloud-zoom-gallery').CloudZoom();
    });

    function format(str) {
        for (var i = 1; i < arguments.length; i++) {
            str = str.replace('%' + (i - 1), arguments[i]);
        }
        return str;
    }

    function CloudZoom(jWin, opts) {
        var sImg = $('img', jWin);
        var img1;
        var img2;
        var zoomDiv = null;
        var $mouseTrap = null;
        var lens = null;
        var $tint = null;
        var softFocus = null;
        var $ie6Fix = null;
        var zoomImage;
        var controlTimer = 0;      
        var cw, ch;
        var destU = 0;
        var destV = 0;
        var currV = 0;
        var currU = 0;      
        var filesLoaded = 0;
        var mx,
            my; 
        var ctx = this, zw;
        // Display an image loading message. This message gets deleted when the images have loaded and the zoom init function is called.
        // We add a small delay before the message is displayed to avoid the message flicking on then off again virtually immediately if the
        // images load really fast, e.g. from the cache. 
        //var   ctx = this;
        setTimeout(function () {
            //                       <img src="/images/loading.gif"/>
            if ($mouseTrap === null) {
                var w = jWin.width();
                jWin.parent().append(format('<div style="width:%0px;position:absolute;top:75%;left:%1px;text-align:center" class="cloud-zoom-loading" >Loading...</div>', w / 3, (w / 2) - (w / 6))).find(':last').css('opacity', 0.5);
            }
        }, 200);


        var ie6FixRemove = function () {

            if ($ie6Fix !== null) {
                $ie6Fix.remove();
                $ie6Fix = null;
            }
        };

        // Removes cursor, tint layer, blur layer etc.
        this.removeBits = function () {
            //$mouseTrap.unbind();
            if (lens) {
                lens.remove();
                lens = null;             
            }
            if ($tint) {
                $tint.remove();
                $tint = null;
            }
            if (softFocus) {
                softFocus.remove();
                softFocus = null;
            }
            ie6FixRemove();

            $('.cloud-zoom-loading', jWin.parent()).remove();
        };


        this.destroy = function () {
            jWin.data('zoom', null);

            if ($mouseTrap) {
                $mouseTrap.unbind();
                $mouseTrap.remove();
                $mouseTrap = null;
            }
            if (zoomDiv) {
                zoomDiv.remove();
                zoomDiv = null;
            }
            //ie6FixRemove();
            this.removeBits();
            // DON'T FORGET TO REMOVE JQUERY 'DATA' VALUES
        };


        // This is called when the zoom window has faded out so it can be removed.
        this.fadedOut = function () {
            
            if (zoomDiv) {
                zoomDiv.remove();
                zoomDiv = null;
            }
             this.removeBits();
            //ie6FixRemove();
        };

        this.controlLoop = function () {
            if (lens) {
                var x = (mx - sImg.offset().left - (cw * 0.5)) >> 0;
                var y = (my - sImg.offset().top - (ch * 0.5)) >> 0;
               
                if (x < 0) {
                    x = 0;
                }
                else if (x > (sImg.outerWidth() - cw)) {
                    x = (sImg.outerWidth() - cw);
                }
                if (y < 0) {
                    y = 0;
                }
                else if (y > (sImg.outerHeight() - ch)) {
                    y = (sImg.outerHeight() - ch);
                }

                lens.css({
                    left: x,
                    top: y
                });
                lens.css('background-position', (-x) + 'px ' + (-y) + 'px');

                destU = (((x) / sImg.outerWidth()) * zoomImage.width) >> 0;
                destV = (((y) / sImg.outerHeight()) * zoomImage.height) >> 0;
                currU += (destU - currU) / opts.smoothMove;
                currV += (destV - currV) / opts.smoothMove;

                zoomDiv.css('background-position', (-(currU >> 0) + 'px ') + (-(currV >> 0) + 'px'));              
            }
            controlTimer = setTimeout(function () {
                ctx.controlLoop();
            }, 30);
        };

        this.init2 = function (img, id) {

            filesLoaded++;
            //console.log(img.src + ' ' + id + ' ' + img.width);    
            if (id === 1) {
                zoomImage = img;
            }
            //this.images[id] = img;
            if (filesLoaded === 2) {
                this.init();
            }
        };

        /* Init function start.  */
        this.init = function () {
            // Remove loading message (if present);
            $('.cloud-zoom-loading', jWin.parent()).remove();


/* Add a box (mouseTrap) over the small image to trap mouse events.
        It has priority over zoom window to avoid issues with inner zoom.
        We need the dummy background image as IE does not trap mouse events on
        transparent parts of a div.
        */
            $mouseTrap = jWin.parent().append(format("<div class='mousetrap' style='background-image:url(\".\");z-index:999;position:absolute;width:%0px;height:%1px;left:%2px;top:%3px;\'></div>", sImg.outerWidth(), sImg.outerHeight(), 0, 0)).find(':last');

            //////////////////////////////////////////////////////////////////////          
            /* Do as little as possible in mousemove event to prevent slowdown. */
            $mouseTrap.bind('mousemove', this, function (event) {
                // Just update the mouse position
                mx = event.pageX;
                my = event.pageY;
            });
            //////////////////////////////////////////////////////////////////////                  
            $mouseTrap.bind('mouseleave', this, function (event) {
                clearTimeout(controlTimer);
                //event.data.removeBits();                
                if(lens) { lens.fadeOut(299); }
                if($tint) { $tint.fadeOut(299); }
                if(softFocus) { softFocus.fadeOut(299); }
                zoomDiv.fadeOut(300, function () {
                    ctx.fadedOut();
                });                                                             
                return false;
            });
            //////////////////////////////////////////////////////////////////////          
            $mouseTrap.bind('mouseenter', this, function (event) {
                mx = event.pageX;
                my = event.pageY;
                zw = event.data;
                if (zoomDiv) {
                    zoomDiv.stop(true, false);
                    zoomDiv.remove();
                }

                var xPos = opts.adjustX,
                    yPos = opts.adjustY;
                             
                var siw = sImg.outerWidth();
                var sih = sImg.outerHeight();

                var w = opts.zoomWidth;
                var h = opts.zoomHeight;
                if (opts.zoomWidth == 'auto') {
                    w = siw;
                }
                if (opts.zoomHeight == 'auto') {
                    h = sih;
                }
                //$('#info').text( xPos + ' ' + yPos + ' ' + siw + ' ' + sih );
                var appendTo = jWin.parent(); // attach to the wrapper          
                switch (opts.position) {
                case 'top':
                    yPos -= h; // + opts.adjustY;
                    break;
                case 'right':
                    xPos += siw; // + opts.adjustX;                 
                    break;
                case 'bottom':
                    yPos += sih; // + opts.adjustY;
                    break;
                case 'left':
                    xPos -= w; // + opts.adjustX;                   
                    break;
                case 'inside':
                    w = siw;
                    h = sih;
                    break;
                    // All other values, try and find an id in the dom to attach to.
                default:
                    appendTo = $('#' + opts.position);
                    // If dom element doesn't exit, just use 'right' position as default.
                    if (!appendTo.length) {
                        appendTo = jWin;
                        xPos += siw; //+ opts.adjustX;
                        yPos += sih; // + opts.adjustY; 
                    } else {
                        w = appendTo.innerWidth();
                        h = appendTo.innerHeight();
                    }
                }

                zoomDiv = appendTo.append(format('<div id="cloud-zoom-big" class="cloud-zoom-big" style="display:none;position:absolute;left:%0px;top:%1px;width:%2px;height:%3px;background-image:url(\'%4\');z-index:99;"></div>', xPos, yPos, w, h, zoomImage.src)).find(':last');

                // Add the title from title tag.
                if (sImg.attr('title') && opts.showTitle) {
                    zoomDiv.append(format('<div class="cloud-zoom-title">%0</div>', sImg.attr('title'))).find(':last').css('opacity', opts.titleOpacity);
                }

                // Fix ie6 select elements wrong z-index bug. Placing an iFrame over the select element solves the issue...     
                if ($.browser.msie && $.browser.version < 7) {
                    $ie6Fix = $('<iframe frameborder="0" src="#"></iframe>').css({
                        position: "absolute",
                        left: xPos,
                        top: yPos,
                        zIndex: 99,
                        width: w,
                        height: h
                    }).insertBefore(zoomDiv);
                }

                zoomDiv.fadeIn(500);

                if (lens) {
                    lens.remove();
                    lens = null;
                } /* Work out size of cursor */
                cw = (sImg.outerWidth() / zoomImage.width) * zoomDiv.width();
                ch = (sImg.outerHeight() / zoomImage.height) * zoomDiv.height();

                // Attach mouse, initially invisible to prevent first frame glitch
                lens = jWin.append(format("<div class = 'cloud-zoom-lens' style='display:none;z-index:98;position:absolute;width:%0px;height:%1px;'></div>", cw, ch)).find(':last');

                $mouseTrap.css('cursor', lens.css('cursor'));

                var noTrans = false;

                // Init tint layer if needed. (Not relevant if using inside mode)           
                if (opts.tint) {
                    lens.css('background', 'url("' + sImg.attr('src') + '")');
                    $tint = jWin.append(format('<div style="display:none;position:absolute; left:0px; top:0px; width:%0px; height:%1px; background-color:%2;" />', sImg.outerWidth(), sImg.outerHeight(), opts.tint)).find(':last');
                    $tint.css('opacity', opts.tintOpacity);                    
                    noTrans = true;
                    $tint.fadeIn(500);

                }
                if (opts.softFocus) {
                    lens.css('background', 'url("' + sImg.attr('src') + '")');
                    softFocus = jWin.append(format('<div style="position:absolute;display:none;top:2px; left:2px; width:%0px; height:%1px;" />', sImg.outerWidth() - 2, sImg.outerHeight() - 2, opts.tint)).find(':last');
                    softFocus.css('background', 'url("' + sImg.attr('src') + '")');
                    softFocus.css('opacity', 0.5);
                    noTrans = true;
                    softFocus.fadeIn(500);
                }

                if (!noTrans) {
                    lens.css('opacity', opts.lensOpacity);                                      
                }
                if ( opts.position !== 'inside' ) { lens.fadeIn(500); }

                // Start processing. 
                zw.controlLoop();

                return; // Don't return false here otherwise opera will not detect change of the mouse pointer type.
            });
        };

        img1 = new Image();
        $(img1).load(function () {
            ctx.init2(this, 0);
        });
        img1.src = sImg.attr('src');

        img2 = new Image();
        $(img2).load(function () {
            ctx.init2(this, 1);
        });
        img2.src = jWin.attr('href');
    }

    $.fn.CloudZoom = function (options) {
        // IE6 background image flicker fix
        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch (e) {}
        this.each(function () {
            var relOpts, opts;
            // Hmm...eval...slap on wrist.
            eval('var   a = {' + $(this).attr('rel') + '}');
            relOpts = a;
            if ($(this).is('.cloud-zoom')) {
                $(this).css({
                    'position': 'relative',
                    'display': 'block'
                });
                $('img', $(this)).css({
                    'display': 'block'
                });
                // Wrap an outer div around the link so we can attach things without them becoming part of the link.
                // But not if wrap already exists.
                if ($(this).parent().attr('id') != 'wrap') {
                    $(this).wrap('<div id="wrap" style="top:0px;z-index:9999;position:relative;"></div>');
                }
                opts = $.extend({}, $.fn.CloudZoom.defaults, options);
                opts = $.extend({}, opts, relOpts);
                $(this).data('zoom', new CloudZoom($(this), opts));

            } else if ($(this).is('.cloud-zoom-gallery')) {
                opts = $.extend({}, relOpts, options);
                $(this).data('relOpts', opts);
                $(this).bind('click', $(this), function (event) {
                    var data = event.data.data('relOpts');
                    // Destroy the previous zoom
                    $('#' + data.useZoom).data('zoom').destroy();
                    // Change the biglink to point to the new big image.
                    $('#' + data.useZoom).attr('href', event.data.attr('href'));
                    // Change the small image to point to the new small image.
                    $('#' + data.useZoom + ' img').attr('src', event.data.data('relOpts').smallImage);
                    // Init a new zoom with the new images.             
                    $('#' + event.data.data('relOpts').useZoom).CloudZoom();
                    return false;
                });
            }
        });
        return this;
    };

    $.fn.CloudZoom.defaults = {
        zoomWidth: 'auto',
        zoomHeight: 'auto',
        position: 'right',
        tint: false,
        tintOpacity: 0.5,
        lensOpacity: 0.5,
        softFocus: false,
        smoothMove: 3,
        showTitle: true,
        titleOpacity: 0.5,
        adjustX: 0,
        adjustY: 0
    };

})(jQuery);



// slimbox

/*
	Slimbox v2.03 - The ultimate lightweight Lightbox clone for jQuery
	(c) 2007-2009 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/
(function(w){var E=w(window),u,g,F=-1,o,x,D,v,y,L,s,n=!window.XMLHttpRequest,e=window.opera&&(document.compatMode=="CSS1Compat")&&(w.browser.version>=9.3),m=document.documentElement,l={},t=new Image(),J=new Image(),H,a,h,q,I,d,G,c,A,K;w(function(){w("body").append(w([H=w('<div id="lbOverlay" />')[0],a=w('<div id="lbCenter" />')[0],G=w('<div id="lbBottomContainer" />')[0]]).css("display","none"));h=w('<div id="lbImage" />').appendTo(a).append(q=w('<div style="position: relative;" />').append([I=w('<a id="lbPrevLink" href="#" />').click(B)[0],d=w('<a id="lbNextLink" href="#" />').click(f)[0]])[0])[0];c=w('<div id="lbBottom" />').appendTo(G).append([w('<a id="lbCloseLink" href="#" />').add(H).click(C)[0],A=w('<div id="lbCaption" />')[0],K=w('<div id="lbNumber" />')[0],w('<div style="clear: both;" />')[0]])[0]});w.slimbox=function(O,N,M){u=w.extend({loop:false,overlayOpacity:0.8,overlayFadeDuration:400,resizeDuration:400,resizeEasing:"swing",initialWidth:250,initialHeight:250,imageFadeDuration:400,captionAnimationDuration:400,counterText:"Image {x} of {y}",closeKeys:[27,88,67],previousKeys:[37,80],nextKeys:[39,78]},M);if(typeof O=="string"){O=[[O,N]];N=0}y=E.scrollTop()+((e?m.clientHeight:E.height())/2);L=u.initialWidth;s=u.initialHeight;w(a).css({top:Math.max(0,y-(s/2)),width:L,height:s,marginLeft:-L/2}).show();v=n||(H.currentStyle&&(H.currentStyle.position!="fixed"));if(v){H.style.position="absolute"}w(H).css("opacity",u.overlayOpacity).fadeIn(u.overlayFadeDuration);z();k(1);g=O;u.loop=u.loop&&(g.length>1);return b(N)};w.fn.slimbox=function(M,P,O){P=P||function(Q){return[Q.href,Q.title]};O=O||function(){return true};var N=this;return N.unbind("click").click(function(){var S=this,U=0,T,Q=0,R;T=w.grep(N,function(W,V){return O.call(S,W,V)});for(R=T.length;Q<R;++Q){if(T[Q]==S){U=Q}T[Q]=P(T[Q],Q)}return w.slimbox(T,U,M)})};function z(){var N=E.scrollLeft(),M=e?m.clientWidth:E.width();w([a,G]).css("left",N+(M/2));if(v){w(H).css({left:N,top:E.scrollTop(),width:M,height:E.height()})}}function k(M){w("object").add(n?"select":"embed").each(function(O,P){if(M){w.data(P,"slimbox",P.style.visibility)}P.style.visibility=M?"hidden":w.data(P,"slimbox")});var N=M?"bind":"unbind";E[N]("scroll resize",z);w(document)[N]("keydown",p)}function p(O){var N=O.keyCode,M=w.inArray;return(M(N,u.closeKeys)>=0)?C():(M(N,u.nextKeys)>=0)?f():(M(N,u.previousKeys)>=0)?B():false}function B(){return b(x)}function f(){return b(D)}function b(M){if(M>=0){F=M;o=g[F][0];x=(F||(u.loop?g.length:0))-1;D=((F+1)%g.length)||(u.loop?0:-1);r();a.className="lbLoading";l=new Image();l.onload=j;l.src=o}return false}function j(){a.className="";w(h).css({backgroundImage:"url("+o+")",visibility:"hidden",display:""});w(q).width(l.width);w([q,I,d]).height(l.height);w(A).html(g[F][1]||"");w(K).html((((g.length>1)&&u.counterText)||"").replace(/{x}/,F+1).replace(/{y}/,g.length));if(x>=0){t.src=g[x][0]}if(D>=0){J.src=g[D][0]}L=h.offsetWidth;s=h.offsetHeight;var M=Math.max(0,y-(s/2));if(a.offsetHeight!=s){w(a).animate({height:s,top:M},u.resizeDuration,u.resizeEasing)}if(a.offsetWidth!=L){w(a).animate({width:L,marginLeft:-L/2},u.resizeDuration,u.resizeEasing)}w(a).queue(function(){w(G).css({width:L,top:M+s,marginLeft:-L/2,visibility:"hidden",display:""});w(h).css({display:"none",visibility:"",opacity:""}).fadeIn(u.imageFadeDuration,i)})}function i(){if(x>=0){w(I).show()}if(D>=0){w(d).show()}w(c).css("marginTop",-c.offsetHeight).animate({marginTop:0},u.captionAnimationDuration);G.style.visibility=""}function r(){l.onload=null;l.src=t.src=J.src=o;w([a,h,c]).stop(true);w([I,d,h,G]).hide()}function C(){if(F>=0){r();F=x=D=-1;w(a).hide();w(H).stop().fadeOut(u.overlayFadeDuration,k)}return false}})(jQuery);

// AUTOLOAD CODE BLOCK (MAY BE CHANGED OR REMOVED)
if (!/android|iphone|ipod|series60|symbian|windows ce|blackberry/i.test(navigator.userAgent)) {
	jQuery(function($) {
		$("a[rel^='lightbox']").slimbox({/* Put custom options here */}, null, function(el) {
			return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
		});
	});
}

// The colorbox

(function($,document,window){var
defaults={transition:"elastic",speed:300,width:false,initialWidth:"600",innerWidth:false,maxWidth:false,height:false,initialHeight:"450",innerHeight:false,maxHeight:false,scalePhotos:true,scrolling:true,inline:false,html:false,iframe:false,fastIframe:true,photo:false,href:false,title:false,rel:false,opacity:0.9,preloading:true,current:"image {current} of {total}",previous:"previous",next:"next",close:"close",open:false,returnFocus:true,reposition:true,loop:true,slideshow:false,slideshowAuto:true,slideshowSpeed:2500,slideshowStart:"start slideshow",slideshowStop:"stop slideshow",onOpen:false,onLoad:false,onComplete:false,onCleanup:false,onClosed:false,overlayClose:true,escKey:true,arrowKey:true,top:false,bottom:false,left:false,right:false,fixed:false,data:undefined},colorbox='colorbox',prefix='cbox',boxElement=prefix+'Element',event_open=prefix+'_open',event_load=prefix+'_load',event_complete=prefix+'_complete',event_cleanup=prefix+'_cleanup',event_closed=prefix+'_closed',event_purge=prefix+'_purge',isIE=!$.support.opacity&&!$.support.style,isIE6=isIE&&!window.XMLHttpRequest,event_ie6=prefix+'_IE6',$overlay,$box,$wrap,$content,$topBorder,$leftBorder,$rightBorder,$bottomBorder,$related,$window,$loaded,$loadingBay,$loadingOverlay,$title,$current,$slideshow,$next,$prev,$close,$groupControls,settings,interfaceHeight,interfaceWidth,loadedHeight,loadedWidth,element,index,photo,open,active,closing,loadingTimer,publicMethod,div="div",init;function $tag(tag,id,css){var element=document.createElement(tag);if(id){element.id=prefix+ id;}
if(css){element.style.cssText=css;}
return $(element);}
function getIndex(increment){var
max=$related.length,newIndex=(index+ increment)%max;return(newIndex<0)?max+ newIndex:newIndex;}
function setSize(size,dimension){return Math.round((/%/.test(size)?((dimension==='x'?$window.width():$window.height())/100):1)*parseInt(size,10));}
function isImage(url){return settings.photo||/\.(gif|png|jpe?g|bmp|ico)((#|\?).*)?$/i.test(url);}
function makeSettings(){var i;settings=$.extend({},$.data(element,colorbox));for(i in settings){if($.isFunction(settings[i])&&i.slice(0,2)!=='on'){settings[i]=settings[i].call(element);}}
settings.rel=settings.rel||element.rel||'nofollow';settings.href=settings.href||$(element).attr('href');settings.title=settings.title||element.title;if(typeof settings.href==="string"){settings.href=$.trim(settings.href);}}
function trigger(event,callback){$.event.trigger(event);if(callback){callback.call(element);}}
function slideshow(){var
timeOut,className=prefix+"Slideshow_",click="click."+ prefix,start,stop,clear;if(settings.slideshow&&$related[1]){start=function(){$slideshow.text(settings.slideshowStop).unbind(click).bind(event_complete,function(){if(settings.loop||$related[index+ 1]){timeOut=setTimeout(publicMethod.next,settings.slideshowSpeed);}}).bind(event_load,function(){clearTimeout(timeOut);}).one(click+' '+ event_cleanup,stop);$box.removeClass(className+"off").addClass(className+"on");timeOut=setTimeout(publicMethod.next,settings.slideshowSpeed);};stop=function(){clearTimeout(timeOut);$slideshow.text(settings.slideshowStart).unbind([event_complete,event_load,event_cleanup,click].join(' ')).one(click,function(){publicMethod.next();start();});$box.removeClass(className+"on").addClass(className+"off");};if(settings.slideshowAuto){start();}else{stop();}}else{$box.removeClass(className+"off "+ className+"on");}}
function launch(target){if(!closing){element=target;makeSettings();$related=$(element);index=0;if(settings.rel!=='nofollow'){$related=$('.'+ boxElement).filter(function(){var relRelated=$.data(this,colorbox).rel||this.rel;return(relRelated===settings.rel);});index=$related.index(element);if(index===-1){$related=$related.add(element);index=$related.length- 1;}}
if(!open){open=active=true;$box.show();if(settings.returnFocus){$(element).blur().one(event_closed,function(){$(this).focus();});}
$overlay.css({"opacity":+settings.opacity,"cursor":settings.overlayClose?"pointer":"auto"}).show();settings.w=setSize(settings.initialWidth,'x');settings.h=setSize(settings.initialHeight,'y');publicMethod.position();if(isIE6){$window.bind('resize.'+ event_ie6+' scroll.'+ event_ie6,function(){$overlay.css({width:$window.width(),height:$window.height(),top:$window.scrollTop(),left:$window.scrollLeft()});}).trigger('resize.'+ event_ie6);}
trigger(event_open,settings.onOpen);$groupControls.add($title).hide();$close.html(settings.close).show();}
publicMethod.load(true);}}
function appendHTML(){if(!$box&&document.body){init=false;$window=$(window);$box=$tag(div).attr({id:colorbox,'class':isIE?prefix+(isIE6?'IE6':'IE'):''}).hide();$overlay=$tag(div,"Overlay",isIE6?'position:absolute':'').hide();$wrap=$tag(div,"Wrapper");$content=$tag(div,"Content").append($loaded=$tag(div,"LoadedContent",'width:0; height:0; overflow:hidden'),$loadingOverlay=$tag(div,"LoadingOverlay").add($tag(div,"LoadingGraphic")),$title=$tag(div,"Title"),$current=$tag(div,"Current"),$next=$tag(div,"Next"),$prev=$tag(div,"Previous"),$slideshow=$tag(div,"Slideshow").bind(event_open,slideshow),$close=$tag(div,"Close"));$wrap.append($tag(div).append($tag(div,"TopLeft"),$topBorder=$tag(div,"TopCenter"),$tag(div,"TopRight")),$tag(div,false,'clear:left').append($leftBorder=$tag(div,"MiddleLeft"),$content,$rightBorder=$tag(div,"MiddleRight")),$tag(div,false,'clear:left').append($tag(div,"BottomLeft"),$bottomBorder=$tag(div,"BottomCenter"),$tag(div,"BottomRight"))).find('div div').css({'float':'left'});$loadingBay=$tag(div,false,'position:absolute; width:9999px; visibility:hidden; display:none');$groupControls=$next.add($prev).add($current).add($slideshow);$(document.body).append($overlay,$box.append($wrap,$loadingBay));}}
function addBindings(){if($box){if(!init){init=true;interfaceHeight=$topBorder.height()+ $bottomBorder.height()+ $content.outerHeight(true)- $content.height();interfaceWidth=$leftBorder.width()+ $rightBorder.width()+ $content.outerWidth(true)- $content.width();loadedHeight=$loaded.outerHeight(true);loadedWidth=$loaded.outerWidth(true);$box.css({"padding-bottom":interfaceHeight,"padding-right":interfaceWidth});$next.click(function(){publicMethod.next();});$prev.click(function(){publicMethod.prev();});$close.click(function(){publicMethod.close();});$overlay.click(function(){if(settings.overlayClose){publicMethod.close();}});$(document).bind('keydown.'+ prefix,function(e){var key=e.keyCode;if(open&&settings.escKey&&key===27){e.preventDefault();publicMethod.close();}
if(open&&settings.arrowKey&&$related[1]){if(key===37){e.preventDefault();$prev.click();}else if(key===39){e.preventDefault();$next.click();}}});$('.'+ boxElement,document).live('click',function(e){if(!(e.which>1||e.shiftKey||e.altKey||e.metaKey)){e.preventDefault();launch(this);}});}
return true;}
return false;}
if($.colorbox){return;}
$(appendHTML);publicMethod=$.fn[colorbox]=$[colorbox]=function(options,callback){var $this=this;options=options||{};appendHTML();if(addBindings()){if(!$this[0]){if($this.selector){return $this;}
$this=$('<a/>');options.open=true;}
if(callback){options.onComplete=callback;}
$this.each(function(){$.data(this,colorbox,$.extend({},$.data(this,colorbox)||defaults,options));}).addClass(boxElement);if(($.isFunction(options.open)&&options.open.call($this))||options.open){launch($this[0]);}}
return $this;};publicMethod.position=function(speed,loadedCallback){var
top=0,left=0,offset=$box.offset(),scrollTop=$window.scrollTop(),scrollLeft=$window.scrollLeft();$window.unbind('resize.'+ prefix);$box.css({top:-9e4,left:-9e4});if(settings.fixed&&!isIE6){offset.top-=scrollTop;offset.left-=scrollLeft;$box.css({position:'fixed'});}else{top=scrollTop;left=scrollLeft;$box.css({position:'absolute'});}
if(settings.right!==false){left+=Math.max($window.width()- settings.w- loadedWidth- interfaceWidth- setSize(settings.right,'x'),0);}else if(settings.left!==false){left+=setSize(settings.left,'x');}else{left+=Math.round(Math.max($window.width()- settings.w- loadedWidth- interfaceWidth,0)/2);}
if(settings.bottom!==false){top+=Math.max($window.height()- settings.h- loadedHeight- interfaceHeight- setSize(settings.bottom,'y'),0);}else if(settings.top!==false){top+=setSize(settings.top,'y');}else{top+=Math.round(Math.max($window.height()- settings.h- loadedHeight- interfaceHeight,0)/2);}
$box.css({top:offset.top,left:offset.left});speed=($box.width()===settings.w+ loadedWidth&&$box.height()===settings.h+ loadedHeight)?0:speed||0;$wrap[0].style.width=$wrap[0].style.height="9999px";function modalDimensions(that){$topBorder[0].style.width=$bottomBorder[0].style.width=$content[0].style.width=that.style.width;$content[0].style.height=$leftBorder[0].style.height=$rightBorder[0].style.height=that.style.height;}
$box.dequeue().animate({width:settings.w+ loadedWidth,height:settings.h+ loadedHeight,top:top,left:left},{duration:speed,complete:function(){modalDimensions(this);active=false;$wrap[0].style.width=(settings.w+ loadedWidth+ interfaceWidth)+"px";$wrap[0].style.height=(settings.h+ loadedHeight+ interfaceHeight)+"px";if(settings.reposition){setTimeout(function(){$window.bind('resize.'+ prefix,publicMethod.position);},1);}
if(loadedCallback){loadedCallback();}},step:function(){modalDimensions(this);}});};publicMethod.resize=function(options){if(open){options=options||{};if(options.width){settings.w=setSize(options.width,'x')- loadedWidth- interfaceWidth;}
if(options.innerWidth){settings.w=setSize(options.innerWidth,'x');}
$loaded.css({width:settings.w});if(options.height){settings.h=setSize(options.height,'y')- loadedHeight- interfaceHeight;}
if(options.innerHeight){settings.h=setSize(options.innerHeight,'y');}
if(!options.innerHeight&&!options.height){$loaded.css({height:"auto"});settings.h=$loaded.height();}
$loaded.css({height:settings.h});publicMethod.position(settings.transition==="none"?0:settings.speed);}};publicMethod.prep=function(object){if(!open){return;}
var callback,speed=settings.transition==="none"?0:settings.speed;$loaded.remove();$loaded=$tag(div,'LoadedContent').append(object);function getWidth(){settings.w=settings.w||$loaded.width();settings.w=settings.mw&&settings.mw<settings.w?settings.mw:settings.w;return settings.w;}
function getHeight(){settings.h=settings.h||$loaded.height();settings.h=settings.mh&&settings.mh<settings.h?settings.mh:settings.h;return settings.h;}
$loaded.hide().appendTo($loadingBay.show()).css({width:getWidth(),overflow:settings.scrolling?'auto':'hidden'}).css({height:getHeight()}).prependTo($content);$loadingBay.hide();$(photo).css({'float':'none'});if(isIE6){$('select').not($box.find('select')).filter(function(){return this.style.visibility!=='hidden';}).css({'visibility':'hidden'}).one(event_cleanup,function(){this.style.visibility='inherit';});}
callback=function(){var preload,i,total=$related.length,iframe,frameBorder='frameBorder',allowTransparency='allowTransparency',complete,src,img;if(!open){return;}
function removeFilter(){if(isIE){$box[0].style.removeAttribute('filter');}}
complete=function(){clearTimeout(loadingTimer);$loadingOverlay.hide();trigger(event_complete,settings.onComplete);};if(isIE){if(photo){$loaded.fadeIn(100);}}
$title.html(settings.title).add($loaded).show();if(total>1){if(typeof settings.current==="string"){$current.html(settings.current.replace('{current}',index+ 1).replace('{total}',total)).show();}
$next[(settings.loop||index<total- 1)?"show":"hide"]().html(settings.next);$prev[(settings.loop||index)?"show":"hide"]().html(settings.previous);if(settings.slideshow){$slideshow.show();}
if(settings.preloading){preload=[getIndex(-1),getIndex(1)];while(i=$related[preload.pop()]){src=$.data(i,colorbox).href||i.href;if($.isFunction(src)){src=src.call(i);}
if(isImage(src)){img=new Image();img.src=src;}}}}else{$groupControls.hide();}
if(settings.iframe){iframe=$tag('iframe')[0];if(frameBorder in iframe){iframe[frameBorder]=0;}
if(allowTransparency in iframe){iframe[allowTransparency]="true";}
iframe.name=prefix+(+new Date());if(settings.fastIframe){complete();}else{$(iframe).one('load',complete);}
iframe.src=settings.href;if(!settings.scrolling){iframe.scrolling="no";}
$(iframe).addClass(prefix+'Iframe').appendTo($loaded).one(event_purge,function(){iframe.src="//about:blank";});}else{complete();}
if(settings.transition==='fade'){$box.fadeTo(speed,1,removeFilter);}else{removeFilter();}};if(settings.transition==='fade'){$box.fadeTo(speed,0,function(){publicMethod.position(0,callback);});}else{publicMethod.position(speed,callback);}};publicMethod.load=function(launched){var href,setResize,prep=publicMethod.prep;active=true;photo=false;element=$related[index];if(!launched){makeSettings();}
trigger(event_purge);trigger(event_load,settings.onLoad);settings.h=settings.height?setSize(settings.height,'y')- loadedHeight- interfaceHeight:settings.innerHeight&&setSize(settings.innerHeight,'y');settings.w=settings.width?setSize(settings.width,'x')- loadedWidth- interfaceWidth:settings.innerWidth&&setSize(settings.innerWidth,'x');settings.mw=settings.w;settings.mh=settings.h;if(settings.maxWidth){settings.mw=setSize(settings.maxWidth,'x')- loadedWidth- interfaceWidth;settings.mw=settings.w&&settings.w<settings.mw?settings.w:settings.mw;}
if(settings.maxHeight){settings.mh=setSize(settings.maxHeight,'y')- loadedHeight- interfaceHeight;settings.mh=settings.h&&settings.h<settings.mh?settings.h:settings.mh;}
href=settings.href;loadingTimer=setTimeout(function(){$loadingOverlay.show();},100);if(settings.inline){$tag(div).hide().insertBefore($(href)[0]).one(event_purge,function(){$(this).replaceWith($loaded.children());});prep($(href));}else if(settings.iframe){prep(" ");}else if(settings.html){prep(settings.html);}else if(isImage(href)){$(photo=new Image()).addClass(prefix+'Photo').error(function(){settings.title=false;prep($tag(div,'Error').text('This image could not be loaded'));}).load(function(){var percent;photo.onload=null;if(settings.scalePhotos){setResize=function(){photo.height-=photo.height*percent;photo.width-=photo.width*percent;};if(settings.mw&&photo.width>settings.mw){percent=(photo.width- settings.mw)/photo.width;setResize();}
if(settings.mh&&photo.height>settings.mh){percent=(photo.height- settings.mh)/photo.height;setResize();}}
if(settings.h){photo.style.marginTop=Math.max(settings.h- photo.height,0)/2+'px';}
if($related[1]&&(settings.loop||$related[index+ 1])){photo.style.cursor='pointer';photo.onclick=function(){publicMethod.next();};}
if(isIE){photo.style.msInterpolationMode='bicubic';}
setTimeout(function(){prep(photo);},1);});setTimeout(function(){photo.src=href;},1);}else if(href){$loadingBay.load(href,settings.data,function(data,status,xhr){prep(status==='error'?$tag(div,'Error').text('Request unsuccessful: '+ xhr.statusText):$(this).contents());});}};publicMethod.next=function(){if(!active&&$related[1]&&(settings.loop||$related[index+ 1])){index=getIndex(1);publicMethod.load();}};publicMethod.prev=function(){if(!active&&$related[1]&&(settings.loop||index)){index=getIndex(-1);publicMethod.load();}};publicMethod.close=function(){if(open&&!closing){closing=true;open=false;trigger(event_cleanup,settings.onCleanup);$window.unbind('.'+ prefix+' .'+ event_ie6);$overlay.fadeTo(200,0);$box.stop().fadeTo(300,0,function(){$box.add($overlay).css({'opacity':1,cursor:'auto'}).hide();trigger(event_purge);$loaded.remove();setTimeout(function(){closing=false;trigger(event_closed,settings.onClosed);},1);});}};publicMethod.remove=function(){$([]).add($box).add($overlay).remove();$box=null;$('.'+ boxElement).removeData(colorbox).removeClass(boxElement).die();};publicMethod.element=function(){return $(element);};publicMethod.settings=defaults;}(jQuery,document,this));

// the jcarousel

/*!
 * jCarousel - Riding carousels with jQuery
 *   http://sorgalla.com/jcarousel/
 *
 * Copyright (c) 2006 Jan Sorgalla (http://sorgalla.com)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Built on top of the jQuery library
 *   http://jquery.com
 *
 * Inspired by the "Carousel Component" by Bill Scott
 *   http://billwscott.com/carousel/
 */

(function(a){var b={vertical:!1,rtl:!1,start:1,offset:1,size:null,scroll:3,visible:null,animation:"normal",easing:"swing",auto:0,wrap:null,initCallback:null,setupCallback:null,reloadCallback:null,itemLoadCallback:null,itemFirstInCallback:null,itemFirstOutCallback:null,itemLastInCallback:null,itemLastOutCallback:null,itemVisibleInCallback:null,itemVisibleOutCallback:null,animationStepCallback:null,buttonNextHTML:"<div></div>",buttonPrevHTML:"<div></div>",buttonNextEvent:"click",buttonPrevEvent:"click",buttonNextCallback:null,buttonPrevCallback:null,itemFallbackDimension:null},c=!1;a(window).bind("load.jcarousel",function(){c=!0}),a.jcarousel=function(e,f){this.options=a.extend({},b,f||{}),this.locked=!1,this.autoStopped=!1,this.container=null,this.clip=null,this.list=null,this.buttonNext=null,this.buttonPrev=null,this.buttonNextState=null,this.buttonPrevState=null,f&&void 0!==f.rtl||(this.options.rtl="rtl"==(a(e).attr("dir")||a("html").attr("dir")||"").toLowerCase()),this.wh=this.options.vertical?"height":"width",this.lt=this.options.vertical?"top":this.options.rtl?"right":"left";for(var g="",h=e.className.split(" "),i=0;h.length>i;i++)if(-1!=h[i].indexOf("jcarousel-skin")){a(e).removeClass(h[i]),g=h[i];break}"UL"==e.nodeName.toUpperCase()||"OL"==e.nodeName.toUpperCase()?(this.list=a(e),this.clip=this.list.parents(".jcarousel-clip"),this.container=this.list.parents(".jcarousel-container")):(this.container=a(e),this.list=this.container.find("ul,ol").eq(0),this.clip=this.container.find(".jcarousel-clip")),0===this.clip.size()&&(this.clip=this.list.wrap("<div></div>").parent()),0===this.container.size()&&(this.container=this.clip.wrap("<div></div>").parent()),""!==g&&-1==this.container.parent()[0].className.indexOf("jcarousel-skin")&&this.container.wrap('<div class=" '+g+'"></div>'),this.buttonPrev=a(".jcarousel-prev",this.container),0===this.buttonPrev.size()&&null!==this.options.buttonPrevHTML&&(this.buttonPrev=a(this.options.buttonPrevHTML).appendTo(this.container)),this.buttonPrev.addClass(this.className("jcarousel-prev")),this.buttonNext=a(".jcarousel-next",this.container),0===this.buttonNext.size()&&null!==this.options.buttonNextHTML&&(this.buttonNext=a(this.options.buttonNextHTML).appendTo(this.container)),this.buttonNext.addClass(this.className("jcarousel-next")),this.clip.addClass(this.className("jcarousel-clip")).css({position:"relative"}),this.list.addClass(this.className("jcarousel-list")).css({overflow:"hidden",position:"relative",top:0,margin:0,padding:0}).css(this.options.rtl?"right":"left",0),this.container.addClass(this.className("jcarousel-container")).css({position:"relative"}),!this.options.vertical&&this.options.rtl&&this.container.addClass("jcarousel-direction-rtl").attr("dir","rtl");var j=null!==this.options.visible?Math.ceil(this.clipping()/this.options.visible):null,k=this.list.children("li"),l=this;if(k.size()>0){var m=0,n=this.options.offset;k.each(function(){l.format(this,n++),m+=l.dimension(this,j)}),this.list.css(this.wh,m+100+"px"),f&&void 0!==f.size||(this.options.size=k.size())}this.container.css("display","block"),this.buttonNext.css("display","block"),this.buttonPrev.css("display","block"),this.funcNext=function(){return l.next(),!1},this.funcPrev=function(){return l.prev(),!1},this.funcResize=function(){l.resizeTimer&&clearTimeout(l.resizeTimer),l.resizeTimer=setTimeout(function(){l.reload()},100)},null!==this.options.initCallback&&this.options.initCallback(this,"init"),!c&&d.isSafari()?(this.buttons(!1,!1),a(window).bind("load.jcarousel",function(){l.setup()})):this.setup()};var d=a.jcarousel;d.fn=d.prototype={jcarousel:"0.2.9"},d.fn.extend=d.extend=a.extend,d.fn.extend({setup:function(){if(this.first=null,this.last=null,this.prevFirst=null,this.prevLast=null,this.animating=!1,this.timer=null,this.resizeTimer=null,this.tail=null,this.inTail=!1,!this.locked){this.list.css(this.lt,this.pos(this.options.offset)+"px");var b=this.pos(this.options.start,!0);this.prevFirst=this.prevLast=null,this.animate(b,!1),a(window).unbind("resize.jcarousel",this.funcResize).bind("resize.jcarousel",this.funcResize),null!==this.options.setupCallback&&this.options.setupCallback(this)}},reset:function(){this.list.empty(),this.list.css(this.lt,"0px"),this.list.css(this.wh,"10px"),null!==this.options.initCallback&&this.options.initCallback(this,"reset"),this.setup()},reload:function(){if(null!==this.tail&&this.inTail&&this.list.css(this.lt,d.intval(this.list.css(this.lt))+this.tail),this.tail=null,this.inTail=!1,null!==this.options.reloadCallback&&this.options.reloadCallback(this),null!==this.options.visible){var a=this,b=Math.ceil(this.clipping()/this.options.visible),c=0,e=0;this.list.children("li").each(function(d){c+=a.dimension(this,b),a.first>d+1&&(e=c)}),this.list.css(this.wh,c+"px"),this.list.css(this.lt,-e+"px")}this.scroll(this.first,!1)},lock:function(){this.locked=!0,this.buttons()},unlock:function(){this.locked=!1,this.buttons()},size:function(a){return void 0!==a&&(this.options.size=a,this.locked||this.buttons()),this.options.size},has:function(a,b){void 0!==b&&b||(b=a),null!==this.options.size&&b>this.options.size&&(b=this.options.size);for(var c=a;b>=c;c++){var d=this.get(c);if(!d.length||d.hasClass("jcarousel-item-placeholder"))return!1}return!0},get:function(b){return a(">.jcarousel-item-"+b,this.list)},add:function(b,c){var e=this.get(b),f=0,g=a(c);if(0===e.length){var h,i=d.intval(b);for(e=this.create(b);;)if(h=this.get(--i),0>=i||h.length){0>=i?this.list.prepend(e):h.after(e);break}}else f=this.dimension(e);"LI"==g.get(0).nodeName.toUpperCase()?(e.replaceWith(g),e=g):e.empty().append(c),this.format(e.removeClass(this.className("jcarousel-item-placeholder")),b);var j=null!==this.options.visible?Math.ceil(this.clipping()/this.options.visible):null,k=this.dimension(e,j)-f;return b>0&&this.first>b&&this.list.css(this.lt,d.intval(this.list.css(this.lt))-k+"px"),this.list.css(this.wh,d.intval(this.list.css(this.wh))+k+"px"),e},remove:function(a){var b=this.get(a);if(b.length&&!(a>=this.first&&this.last>=a)){var c=this.dimension(b);this.first>a&&this.list.css(this.lt,d.intval(this.list.css(this.lt))+c+"px"),b.remove(),this.list.css(this.wh,d.intval(this.list.css(this.wh))-c+"px")}},next:function(){null===this.tail||this.inTail?this.scroll("both"!=this.options.wrap&&"last"!=this.options.wrap||null===this.options.size||this.last!=this.options.size?this.first+this.options.scroll:1):this.scrollTail(!1)},prev:function(){null!==this.tail&&this.inTail?this.scrollTail(!0):this.scroll("both"!=this.options.wrap&&"first"!=this.options.wrap||null===this.options.size||1!=this.first?this.first-this.options.scroll:this.options.size)},scrollTail:function(a){if(!this.locked&&!this.animating&&this.tail){this.pauseAuto();var b=d.intval(this.list.css(this.lt));b=a?b+this.tail:b-this.tail,this.inTail=!a,this.prevFirst=this.first,this.prevLast=this.last,this.animate(b)}},scroll:function(a,b){this.locked||this.animating||(this.pauseAuto(),this.animate(this.pos(a),b))},pos:function(a,b){var c=d.intval(this.list.css(this.lt));if(this.locked||this.animating)return c;"circular"!=this.options.wrap&&(a=1>a?1:this.options.size&&a>this.options.size?this.options.size:a);for(var m,e=this.first>a,f="circular"!=this.options.wrap&&1>=this.first?1:this.first,g=e?this.get(f):this.get(this.last),h=e?f:f-1,i=null,j=0,k=!1,l=0;e?--h>=a:a>++h;)i=this.get(h),k=!i.length,0===i.length&&(i=this.create(h).addClass(this.className("jcarousel-item-placeholder")),g[e?"before":"after"](i),null!==this.first&&"circular"==this.options.wrap&&null!==this.options.size&&(0>=h||h>this.options.size)&&(m=this.get(this.index(h)),m.length&&(i=this.add(h,m.clone(!0))))),g=i,l=this.dimension(i),k&&(j+=l),null!==this.first&&("circular"==this.options.wrap||h>=1&&(null===this.options.size||this.options.size>=h))&&(c=e?c+l:c-l);var n=this.clipping(),o=[],p=0,q=0;for(g=this.get(a-1),h=a;++p;){if(i=this.get(h),k=!i.length,0===i.length&&(i=this.create(h).addClass(this.className("jcarousel-item-placeholder")),0===g.length?this.list.prepend(i):g[e?"before":"after"](i),null!==this.first&&"circular"==this.options.wrap&&null!==this.options.size&&(0>=h||h>this.options.size)&&(m=this.get(this.index(h)),m.length&&(i=this.add(h,m.clone(!0))))),g=i,l=this.dimension(i),0===l)throw Error("jCarousel: No width/height set for items. This will cause an infinite loop. Aborting...");if("circular"!=this.options.wrap&&null!==this.options.size&&h>this.options.size?o.push(i):k&&(j+=l),q+=l,q>=n)break;h++}for(var r=0;o.length>r;r++)o[r].remove();j>0&&(this.list.css(this.wh,this.dimension(this.list)+j+"px"),e&&(c-=j,this.list.css(this.lt,d.intval(this.list.css(this.lt))-j+"px")));var s=a+p-1;if("circular"!=this.options.wrap&&this.options.size&&s>this.options.size&&(s=this.options.size),h>s)for(p=0,h=s,q=0;++p&&(i=this.get(h--),i.length)&&(q+=this.dimension(i),!(q>=n)););var t=s-p+1;if("circular"!=this.options.wrap&&1>t&&(t=1),this.inTail&&e&&(c+=this.tail,this.inTail=!1),this.tail=null,"circular"!=this.options.wrap&&s==this.options.size&&s-p+1>=1){var u=d.intval(this.get(s).css(this.options.vertical?"marginBottom":"marginRight"));q-u>n&&(this.tail=q-n-u)}for(b&&a===this.options.size&&this.tail&&(c-=this.tail,this.inTail=!0);a-->t;)c+=this.dimension(this.get(a));return this.prevFirst=this.first,this.prevLast=this.last,this.first=t,this.last=s,c},animate:function(b,c){if(!this.locked&&!this.animating){this.animating=!0;var d=this,e=function(){if(d.animating=!1,0===b&&d.list.css(d.lt,0),!d.autoStopped&&("circular"==d.options.wrap||"both"==d.options.wrap||"last"==d.options.wrap||null===d.options.size||d.last<d.options.size||d.last==d.options.size&&null!==d.tail&&!d.inTail)&&d.startAuto(),d.buttons(),d.notify("onAfterAnimation"),"circular"==d.options.wrap&&null!==d.options.size)for(var a=d.prevFirst;d.prevLast>=a;a++)null===a||a>=d.first&&d.last>=a||!(1>a||a>d.options.size)||d.remove(a)};if(this.notify("onBeforeAnimation"),this.options.animation&&c!==!1){var f=this.options.vertical?{top:b}:this.options.rtl?{right:b}:{left:b},g={duration:this.options.animation,easing:this.options.easing,complete:e};a.isFunction(this.options.animationStepCallback)&&(g.step=this.options.animationStepCallback),this.list.animate(f,g)}else this.list.css(this.lt,b+"px"),e()}},startAuto:function(a){if(void 0!==a&&(this.options.auto=a),0===this.options.auto)return this.stopAuto();if(null===this.timer){this.autoStopped=!1;var b=this;this.timer=window.setTimeout(function(){b.next()},1e3*this.options.auto)}},stopAuto:function(){this.pauseAuto(),this.autoStopped=!0},pauseAuto:function(){null!==this.timer&&(window.clearTimeout(this.timer),this.timer=null)},buttons:function(a,b){null==a&&(a=!this.locked&&0!==this.options.size&&(this.options.wrap&&"first"!=this.options.wrap||null===this.options.size||this.last<this.options.size),this.locked||this.options.wrap&&"first"!=this.options.wrap||null===this.options.size||!(this.last>=this.options.size)||(a=null!==this.tail&&!this.inTail)),null==b&&(b=!this.locked&&0!==this.options.size&&(this.options.wrap&&"last"!=this.options.wrap||this.first>1),this.locked||this.options.wrap&&"last"!=this.options.wrap||null===this.options.size||1!=this.first||(b=null!==this.tail&&this.inTail));var c=this;this.buttonNext.size()>0?(this.buttonNext.unbind(this.options.buttonNextEvent+".jcarousel",this.funcNext),a&&this.buttonNext.bind(this.options.buttonNextEvent+".jcarousel",this.funcNext),this.buttonNext[a?"removeClass":"addClass"](this.className("jcarousel-next-disabled")).attr("disabled",a?!1:!0),null!==this.options.buttonNextCallback&&this.buttonNext.data("jcarouselstate")!=a&&this.buttonNext.each(function(){c.options.buttonNextCallback(c,this,a)}).data("jcarouselstate",a)):null!==this.options.buttonNextCallback&&this.buttonNextState!=a&&this.options.buttonNextCallback(c,null,a),this.buttonPrev.size()>0?(this.buttonPrev.unbind(this.options.buttonPrevEvent+".jcarousel",this.funcPrev),b&&this.buttonPrev.bind(this.options.buttonPrevEvent+".jcarousel",this.funcPrev),this.buttonPrev[b?"removeClass":"addClass"](this.className("jcarousel-prev-disabled")).attr("disabled",b?!1:!0),null!==this.options.buttonPrevCallback&&this.buttonPrev.data("jcarouselstate")!=b&&this.buttonPrev.each(function(){c.options.buttonPrevCallback(c,this,b)}).data("jcarouselstate",b)):null!==this.options.buttonPrevCallback&&this.buttonPrevState!=b&&this.options.buttonPrevCallback(c,null,b),this.buttonNextState=a,this.buttonPrevState=b},notify:function(a){var b=null===this.prevFirst?"init":this.prevFirst<this.first?"next":"prev";this.callback("itemLoadCallback",a,b),this.prevFirst!==this.first&&(this.callback("itemFirstInCallback",a,b,this.first),this.callback("itemFirstOutCallback",a,b,this.prevFirst)),this.prevLast!==this.last&&(this.callback("itemLastInCallback",a,b,this.last),this.callback("itemLastOutCallback",a,b,this.prevLast)),this.callback("itemVisibleInCallback",a,b,this.first,this.last,this.prevFirst,this.prevLast),this.callback("itemVisibleOutCallback",a,b,this.prevFirst,this.prevLast,this.first,this.last)},callback:function(b,c,d,e,f,g,h){if(null!=this.options[b]&&("object"==typeof this.options[b]||"onAfterAnimation"==c)){var i="object"==typeof this.options[b]?this.options[b][c]:this.options[b];if(a.isFunction(i)){var j=this;if(void 0===e)i(j,d,c);else if(void 0===f)this.get(e).each(function(){i(j,this,e,d,c)});else for(var k=function(a){j.get(a).each(function(){i(j,this,a,d,c)})},l=e;f>=l;l++)null===l||l>=g&&h>=l||k(l)}}},create:function(a){return this.format("<li></li>",a)},format:function(b,c){b=a(b);for(var d=b.get(0).className.split(" "),e=0;d.length>e;e++)-1!=d[e].indexOf("jcarousel-")&&b.removeClass(d[e]);return b.addClass(this.className("jcarousel-item")).addClass(this.className("jcarousel-item-"+c)).css({"float":this.options.rtl?"right":"left","list-style":"none"}).attr("jcarouselindex",c),b},className:function(a){return a+" "+a+(this.options.vertical?"-vertical":"-horizontal")},dimension:function(b,c){var e=a(b);if(null==c)return this.options.vertical?e.innerHeight()+d.intval(e.css("margin-top"))+d.intval(e.css("margin-bottom"))+d.intval(e.css("border-top-width"))+d.intval(e.css("border-bottom-width"))||d.intval(this.options.itemFallbackDimension):e.innerWidth()+d.intval(e.css("margin-left"))+d.intval(e.css("margin-right"))+d.intval(e.css("border-left-width"))+d.intval(e.css("border-right-width"))||d.intval(this.options.itemFallbackDimension);var f=this.options.vertical?c-d.intval(e.css("marginTop"))-d.intval(e.css("marginBottom")):c-d.intval(e.css("marginLeft"))-d.intval(e.css("marginRight"));return a(e).css(this.wh,f+"px"),this.dimension(e)},clipping:function(){return this.options.vertical?this.clip[0].offsetHeight-d.intval(this.clip.css("borderTopWidth"))-d.intval(this.clip.css("borderBottomWidth")):this.clip[0].offsetWidth-d.intval(this.clip.css("borderLeftWidth"))-d.intval(this.clip.css("borderRightWidth"))},index:function(a,b){return null==b&&(b=this.options.size),Math.round(((a-1)/b-Math.floor((a-1)/b))*b)+1}}),d.extend({defaults:function(c){return a.extend(b,c||{})},intval:function(a){return a=parseInt(a,10),isNaN(a)?0:a},windowLoaded:function(){c=!0},isSafari:function(){var a=navigator.userAgent.toLowerCase(),b=/(chrome)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||[],c=b[1]||"";return"webkit"===c}}),a.fn.jcarousel=function(b){if("string"==typeof b){var c=a(this).data("jcarousel"),e=Array.prototype.slice.call(arguments,1);return c[b].apply(c,e)}return this.each(function(){var c=a(this).data("jcarousel");c?(b&&a.extend(c.options,b),c.reload()):a(this).data("jcarousel",new d(this,b))})}})(jQuery);

// The pretty photo
/* ------------------------------------------------------------------------
	Class: prettyPhoto
	Use: Lightbox clone for jQuery
	Author: Stephane Caron (http://www.no-margin-for-errors.com)
	Version: 3.1.5
------------------------------------------------------------------------- */
(function(e){function t(){var e=location.href;hashtag=e.indexOf("#prettyPhoto")!==-1?decodeURI(e.substring(e.indexOf("#prettyPhoto")+1,e.length)):false;return hashtag}function n(){if(typeof theRel=="undefined")return;location.hash=theRel+"/"+rel_index+"/"}function r(){if(location.href.indexOf("#prettyPhoto")!==-1)location.hash="prettyPhoto"}function i(e,t){e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var n="[\\?&]"+e+"=([^&#]*)";var r=new RegExp(n);var i=r.exec(t);return i==null?"":i[1]}e.prettyPhoto={version:"3.1.5"};e.fn.prettyPhoto=function(s){function g(){e(".pp_loaderIcon").hide();projectedTop=scroll_pos["scrollTop"]+(d/2-a["containerHeight"]/2);if(projectedTop<0)projectedTop=0;$ppt.fadeTo(settings.animation_speed,1);$pp_pic_holder.find(".pp_content").animate({height:a["contentHeight"],width:a["contentWidth"]},settings.animation_speed);$pp_pic_holder.animate({top:projectedTop,left:v/2-a["containerWidth"]/2<0?0:v/2-a["containerWidth"]/2,width:a["containerWidth"]},settings.animation_speed,function(){$pp_pic_holder.find(".pp_hoverContainer,#fullResImage").height(a["height"]).width(a["width"]);$pp_pic_holder.find(".pp_fade").fadeIn(settings.animation_speed);if(isSet&&S(pp_images[set_position])=="image"){$pp_pic_holder.find(".pp_hoverContainer").show()}else{$pp_pic_holder.find(".pp_hoverContainer").hide()}if(settings.allow_expand){if(a["resized"]){e("a.pp_expand,a.pp_contract").show()}else{e("a.pp_expand").hide()}}if(settings.autoplay_slideshow&&!m&&!f)e.prettyPhoto.startSlideshow();settings.changepicturecallback();f=true});C();s.ajaxcallback()}function y(t){$pp_pic_holder.find("#pp_full_res object,#pp_full_res embed").css("visibility","hidden");$pp_pic_holder.find(".pp_fade").fadeOut(settings.animation_speed,function(){e(".pp_loaderIcon").show();t()})}function b(t){t>1?e(".pp_nav").show():e(".pp_nav").hide()}function w(e,t){resized=false;E(e,t);imageWidth=e,imageHeight=t;if((p>v||h>d)&&doresize&&settings.allow_resize&&!u){resized=true,fitting=false;while(!fitting){if(p>v){imageWidth=v-200;imageHeight=t/e*imageWidth}else if(h>d){imageHeight=d-200;imageWidth=e/t*imageHeight}else{fitting=true}h=imageHeight,p=imageWidth}if(p>v||h>d){w(p,h)}E(imageWidth,imageHeight)}return{width:Math.floor(imageWidth),height:Math.floor(imageHeight),containerHeight:Math.floor(h),containerWidth:Math.floor(p)+settings.horizontal_padding*2,contentHeight:Math.floor(l),contentWidth:Math.floor(c),resized:resized}}function E(t,n){t=parseFloat(t);n=parseFloat(n);$pp_details=$pp_pic_holder.find(".pp_details");$pp_details.width(t);detailsHeight=parseFloat($pp_details.css("marginTop"))+parseFloat($pp_details.css("marginBottom"));$pp_details=$pp_details.clone().addClass(settings.theme).width(t).appendTo(e("body")).css({position:"absolute",top:-1e4});detailsHeight+=$pp_details.height();detailsHeight=detailsHeight<=34?36:detailsHeight;$pp_details.remove();$pp_title=$pp_pic_holder.find(".ppt");$pp_title.width(t);titleHeight=parseFloat($pp_title.css("marginTop"))+parseFloat($pp_title.css("marginBottom"));$pp_title=$pp_title.clone().appendTo(e("body")).css({position:"absolute",top:-1e4});titleHeight+=$pp_title.height();$pp_title.remove();l=n+detailsHeight;c=t;h=l+titleHeight+$pp_pic_holder.find(".pp_top").height()+$pp_pic_holder.find(".pp_bottom").height();p=t}function S(e){if(e.match(/youtube\.com\/watch/i)||e.match(/youtu\.be/i)){return"youtube"}else if(e.match(/vimeo\.com/i)){return"vimeo"}else if(e.match(/\b.mov\b/i)){return"quicktime"}else if(e.match(/\b.swf\b/i)){return"flash"}else if(e.match(/\biframe=true\b/i)){return"iframe"}else if(e.match(/\bajax=true\b/i)){return"ajax"}else if(e.match(/\bcustom=true\b/i)){return"custom"}else if(e.substr(0,1)=="#"){return"inline"}else{return"image"}}function x(){if(doresize&&typeof $pp_pic_holder!="undefined"){scroll_pos=T();contentHeight=$pp_pic_holder.height(),contentwidth=$pp_pic_holder.width();projectedTop=d/2+scroll_pos["scrollTop"]-contentHeight/2;if(projectedTop<0)projectedTop=0;if(contentHeight>d)return;$pp_pic_holder.css({top:projectedTop,left:v/2+scroll_pos["scrollLeft"]-contentwidth/2})}}function T(){if(self.pageYOffset){return{scrollTop:self.pageYOffset,scrollLeft:self.pageXOffset}}else if(document.documentElement&&document.documentElement.scrollTop){return{scrollTop:document.documentElement.scrollTop,scrollLeft:document.documentElement.scrollLeft}}else if(document.body){return{scrollTop:document.body.scrollTop,scrollLeft:document.body.scrollLeft}}}function N(){d=e(window).height(),v=e(window).width();if(typeof $pp_overlay!="undefined")$pp_overlay.height(e(document).height()).width(v)}function C(){if(isSet&&settings.overlay_gallery&&S(pp_images[set_position])=="image"){itemWidth=52+5;navWidth=settings.theme=="facebook"||settings.theme=="pp_default"?50:30;itemsPerPage=Math.floor((a["containerWidth"]-100-navWidth)/itemWidth);itemsPerPage=itemsPerPage<pp_images.length?itemsPerPage:pp_images.length;totalPage=Math.ceil(pp_images.length/itemsPerPage)-1;if(totalPage==0){navWidth=0;$pp_gallery.find(".pp_arrow_next,.pp_arrow_previous").hide()}else{$pp_gallery.find(".pp_arrow_next,.pp_arrow_previous").show()}galleryWidth=itemsPerPage*itemWidth;fullGalleryWidth=pp_images.length*itemWidth;$pp_gallery.css("margin-left",-(galleryWidth/2+navWidth/2)).find("div:first").width(galleryWidth+5).find("ul").width(fullGalleryWidth).find("li.selected").removeClass("selected");goToPage=Math.floor(set_position/itemsPerPage)<totalPage?Math.floor(set_position/itemsPerPage):totalPage;e.prettyPhoto.changeGalleryPage(goToPage);$pp_gallery_li.filter(":eq("+set_position+")").addClass("selected")}else{$pp_pic_holder.find(".pp_content").unbind("mouseenter mouseleave")}}function k(t){if(settings.social_tools)facebook_like_link=settings.social_tools.replace("{location_href}",encodeURIComponent(location.href));settings.markup=settings.markup.replace("{pp_social}","");e("body").append(settings.markup);$pp_pic_holder=e(".pp_pic_holder"),$ppt=e(".ppt"),$pp_overlay=e("div.pp_overlay");if(isSet&&settings.overlay_gallery){currentGalleryPage=0;toInject="";for(var n=0;n<pp_images.length;n++){if(!pp_images[n].match(/\b(jpg|jpeg|png|gif)\b/gi)){classname="default";img_src=""}else{classname="";img_src=pp_images[n]}toInject+="<li class='"+classname+"'><a href='#'><img src='"+img_src+"' width='50' alt='' /></a></li>"}toInject=settings.gallery_markup.replace(/{gallery}/g,toInject);$pp_pic_holder.find("#pp_full_res").after(toInject);$pp_gallery=e(".pp_pic_holder .pp_gallery"),$pp_gallery_li=$pp_gallery.find("li");$pp_gallery.find(".pp_arrow_next").click(function(){e.prettyPhoto.changeGalleryPage("next");e.prettyPhoto.stopSlideshow();return false});$pp_gallery.find(".pp_arrow_previous").click(function(){e.prettyPhoto.changeGalleryPage("previous");e.prettyPhoto.stopSlideshow();return false});$pp_pic_holder.find(".pp_content").hover(function(){$pp_pic_holder.find(".pp_gallery:not(.disabled)").fadeIn()},function(){$pp_pic_holder.find(".pp_gallery:not(.disabled)").fadeOut()});itemWidth=52+5;$pp_gallery_li.each(function(t){e(this).find("a").click(function(){e.prettyPhoto.changePage(t);e.prettyPhoto.stopSlideshow();return false})})}if(settings.slideshow){$pp_pic_holder.find(".pp_nav").prepend('<a href="#" class="pp_play">Play</a>');$pp_pic_holder.find(".pp_nav .pp_play").click(function(){e.prettyPhoto.startSlideshow();return false})}$pp_pic_holder.attr("class","pp_pic_holder "+settings.theme);$pp_overlay.css({opacity:0,height:e(document).height(),width:e(window).width()}).bind("click",function(){if(!settings.modal)e.prettyPhoto.close()});e("a.pp_close").bind("click",function(){e.prettyPhoto.close();return false});if(settings.allow_expand){e("a.pp_expand").bind("click",function(t){if(e(this).hasClass("pp_expand")){e(this).removeClass("pp_expand").addClass("pp_contract");doresize=false}else{e(this).removeClass("pp_contract").addClass("pp_expand");doresize=true}y(function(){e.prettyPhoto.open()});return false})}$pp_pic_holder.find(".pp_previous, .pp_nav .pp_arrow_previous").bind("click",function(){e.prettyPhoto.changePage("previous");e.prettyPhoto.stopSlideshow();return false});$pp_pic_holder.find(".pp_next, .pp_nav .pp_arrow_next").bind("click",function(){e.prettyPhoto.changePage("next");e.prettyPhoto.stopSlideshow();return false});x()}s=jQuery.extend({hook:"rel",animation_speed:"fast",ajaxcallback:function(){},slideshow:5e3,autoplay_slideshow:false,opacity:.8,show_title:true,allow_resize:true,allow_expand:true,default_width:500,default_height:344,counter_separator_label:"/",theme:"pp_default",horizontal_padding:20,hideflash:false,wmode:"opaque",autoplay:true,modal:false,deeplinking:true,overlay_gallery:true,overlay_gallery_max:30,keyboard_shortcuts:true,changepicturecallback:function(){},callback:function(){},ie6_fallback:true,markup:'<div class="pp_pic_holder"> 						<div class="ppt"> </div> 						<div class="pp_top"> 							<div class="pp_left"></div> 							<div class="pp_middle"></div> 							<div class="pp_right"></div> 						</div> 						<div class="pp_content_container"> 							<div class="pp_left"> 							<div class="pp_right"> 								<div class="pp_content"> 									<div class="pp_loaderIcon"></div> 									<div class="pp_fade"> 										<a href="#" class="pp_expand" title="Expand the image">Expand</a> 										<div class="pp_hoverContainer"> 											<a class="pp_next" href="#">next</a> 											<a class="pp_previous" href="#">previous</a> 										</div> 										<div id="pp_full_res"></div> 										<div class="pp_details"> 											<div class="pp_nav"> 												<a href="#" class="pp_arrow_previous">Previous</a> 												<p class="currentTextHolder">0/0</p> 												<a href="#" class="pp_arrow_next">Next</a> 											</div> 											<p class="pp_description"></p> 											<div class="pp_social">{pp_social}</div> 											<a class="pp_close" href="#">Close</a> 										</div> 									</div> 								</div> 							</div> 							</div> 						</div> 						<div class="pp_bottom"> 							<div class="pp_left"></div> 							<div class="pp_middle"></div> 							<div class="pp_right"></div> 						</div> 					</div> 					<div class="pp_overlay"></div>',gallery_markup:'<div class="pp_gallery"> 								<a href="#" class="pp_arrow_previous">Previous</a> 								<div> 									<ul> 										{gallery} 									</ul> 								</div> 								<a href="#" class="pp_arrow_next">Next</a> 							</div>',image_markup:'<img id="fullResImage" src="{path}" />',flash_markup:'<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="{width}" height="{height}"><param name="wmode" value="{wmode}" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{path}" /><embed src="{path}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="{width}" height="{height}" wmode="{wmode}"></embed></object>',quicktime_markup:'<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="{height}" width="{width}"><param name="src" value="{path}"><param name="autoplay" value="{autoplay}"><param name="type" value="video/quicktime"><embed src="{path}" height="{height}" width="{width}" autoplay="{autoplay}" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/"></embed></object>',iframe_markup:'<iframe src ="{path}" width="{width}" height="{height}" frameborder="no"></iframe>',inline_markup:'<div class="pp_inline">{content}</div>',custom_markup:"",social_tools:'<div class="twitter"><a href="http://twitter.com/share" class="twitter-share-button" data-count="none">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script></div><div class="facebook"><iframe src="//www.facebook.com/plugins/like.php?locale=en_US&href={location_href}&layout=button_count&show_faces=true&width=500&action=like&font&colorscheme=light&height=23" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:500px; height:23px;" allowTransparency="true"></iframe></div>'},s);var o=this,u=false,a,f,l,c,h,p,d=e(window).height(),v=e(window).width(),m;doresize=true,scroll_pos=T();e(window).unbind("resize.prettyphoto").bind("resize.prettyphoto",function(){x();N()});if(s.keyboard_shortcuts){e(document).unbind("keydown.prettyphoto").bind("keydown.prettyphoto",function(t){if(typeof $pp_pic_holder!="undefined"){if($pp_pic_holder.is(":visible")){switch(t.keyCode){case 37:e.prettyPhoto.changePage("previous");t.preventDefault();break;case 39:e.prettyPhoto.changePage("next");t.preventDefault();break;case 27:if(!settings.modal)e.prettyPhoto.close();t.preventDefault();break}}}})}e.prettyPhoto.initialize=function(){settings=s;if(settings.theme=="pp_default")settings.horizontal_padding=16;theRel=e(this).attr(settings.hook);galleryRegExp=/\[(?:.*)\]/;isSet=galleryRegExp.exec(theRel)?true:false;pp_images=isSet?jQuery.map(o,function(t,n){if(e(t).attr(settings.hook).indexOf(theRel)!=-1)return e(t).attr("href")}):e.makeArray(e(this).attr("href"));pp_titles=isSet?jQuery.map(o,function(t,n){if(e(t).attr(settings.hook).indexOf(theRel)!=-1)return e(t).find("img").attr("alt")?e(t).find("img").attr("alt"):""}):e.makeArray(e(this).find("img").attr("alt"));pp_descriptions=isSet?jQuery.map(o,function(t,n){if(e(t).attr(settings.hook).indexOf(theRel)!=-1)return e(t).attr("title")?e(t).attr("title"):""}):e.makeArray(e(this).attr("title"));if(pp_images.length>settings.overlay_gallery_max)settings.overlay_gallery=false;set_position=jQuery.inArray(e(this).attr("href"),pp_images);rel_index=isSet?set_position:e("a["+settings.hook+"^='"+theRel+"']").index(e(this));k(this);if(settings.allow_resize)e(window).bind("scroll.prettyphoto",function(){x()});e.prettyPhoto.open();return false};e.prettyPhoto.open=function(t){if(typeof settings=="undefined"){settings=s;pp_images=e.makeArray(arguments[0]);pp_titles=arguments[1]?e.makeArray(arguments[1]):e.makeArray("");pp_descriptions=arguments[2]?e.makeArray(arguments[2]):e.makeArray("");isSet=pp_images.length>1?true:false;set_position=arguments[3]?arguments[3]:0;k(t.target)}if(settings.hideflash)e("object,embed,iframe[src*=youtube],iframe[src*=vimeo]").css("visibility","hidden");b(e(pp_images).size());e(".pp_loaderIcon").show();if(settings.deeplinking)n();if(settings.social_tools){facebook_like_link=settings.social_tools.replace("{location_href}",encodeURIComponent(location.href));$pp_pic_holder.find(".pp_social").html(facebook_like_link)}if($ppt.is(":hidden"))$ppt.css("opacity",0).show();$pp_overlay.show().fadeTo(settings.animation_speed,settings.opacity);$pp_pic_holder.find(".currentTextHolder").text(set_position+1+settings.counter_separator_label+e(pp_images).size());if(typeof pp_descriptions[set_position]!="undefined"&&pp_descriptions[set_position]!=""){$pp_pic_holder.find(".pp_description").show().html(unescape(pp_descriptions[set_position]))}else{$pp_pic_holder.find(".pp_description").hide()}movie_width=parseFloat(i("width",pp_images[set_position]))?i("width",pp_images[set_position]):settings.default_width.toString();movie_height=parseFloat(i("height",pp_images[set_position]))?i("height",pp_images[set_position]):settings.default_height.toString();u=false;if(movie_height.indexOf("%")!=-1){movie_height=parseFloat(e(window).height()*parseFloat(movie_height)/100-150);u=true}if(movie_width.indexOf("%")!=-1){movie_width=parseFloat(e(window).width()*parseFloat(movie_width)/100-150);u=true}$pp_pic_holder.fadeIn(function(){settings.show_title&&pp_titles[set_position]!=""&&typeof pp_titles[set_position]!="undefined"?$ppt.html(unescape(pp_titles[set_position])):$ppt.html(" ");imgPreloader="";skipInjection=false;switch(S(pp_images[set_position])){case"image":imgPreloader=new Image;nextImage=new Image;if(isSet&&set_position<e(pp_images).size()-1)nextImage.src=pp_images[set_position+1];prevImage=new Image;if(isSet&&pp_images[set_position-1])prevImage.src=pp_images[set_position-1];$pp_pic_holder.find("#pp_full_res")[0].innerHTML=settings.image_markup.replace(/{path}/g,pp_images[set_position]);imgPreloader.onload=function(){a=w(imgPreloader.width,imgPreloader.height);g()};imgPreloader.onerror=function(){alert("Image cannot be loaded. Make sure the path is correct and image exist.");e.prettyPhoto.close()};imgPreloader.src=pp_images[set_position];break;case"youtube":a=w(movie_width,movie_height);movie_id=i("v",pp_images[set_position]);if(movie_id==""){movie_id=pp_images[set_position].split("youtu.be/");movie_id=movie_id[1];if(movie_id.indexOf("?")>0)movie_id=movie_id.substr(0,movie_id.indexOf("?"));if(movie_id.indexOf("&")>0)movie_id=movie_id.substr(0,movie_id.indexOf("&"))}movie="http://www.youtube.com/embed/"+movie_id;i("rel",pp_images[set_position])?movie+="?rel="+i("rel",pp_images[set_position]):movie+="?rel=1";if(settings.autoplay)movie+="&autoplay=1";toInject=settings.iframe_markup.replace(/{width}/g,a["width"]).replace(/{height}/g,a["height"]).replace(/{wmode}/g,settings.wmode).replace(/{path}/g,movie);break;case"vimeo":a=w(movie_width,movie_height);movie_id=pp_images[set_position];var t=/http(s?):\/\/(www\.)?vimeo.com\/(\d+)/;var n=movie_id.match(t);movie="http://player.vimeo.com/video/"+n[3]+"?title=0&byline=0&portrait=0";if(settings.autoplay)movie+="&autoplay=1;";vimeo_width=a["width"]+"/embed/?moog_width="+a["width"];toInject=settings.iframe_markup.replace(/{width}/g,vimeo_width).replace(/{height}/g,a["height"]).replace(/{path}/g,movie);break;case"quicktime":a=w(movie_width,movie_height);a["height"]+=15;a["contentHeight"]+=15;a["containerHeight"]+=15;toInject=settings.quicktime_markup.replace(/{width}/g,a["width"]).replace(/{height}/g,a["height"]).replace(/{wmode}/g,settings.wmode).replace(/{path}/g,pp_images[set_position]).replace(/{autoplay}/g,settings.autoplay);break;case"flash":a=w(movie_width,movie_height);flash_vars=pp_images[set_position];flash_vars=flash_vars.substring(pp_images[set_position].indexOf("flashvars")+10,pp_images[set_position].length);filename=pp_images[set_position];filename=filename.substring(0,filename.indexOf("?"));toInject=settings.flash_markup.replace(/{width}/g,a["width"]).replace(/{height}/g,a["height"]).replace(/{wmode}/g,settings.wmode).replace(/{path}/g,filename+"?"+flash_vars);break;case"iframe":a=w(movie_width,movie_height);frame_url=pp_images[set_position];frame_url=frame_url.substr(0,frame_url.indexOf("iframe")-1);toInject=settings.iframe_markup.replace(/{width}/g,a["width"]).replace(/{height}/g,a["height"]).replace(/{path}/g,frame_url);break;case"ajax":doresize=false;a=w(movie_width,movie_height);doresize=true;skipInjection=true;e.get(pp_images[set_position],function(e){toInject=settings.inline_markup.replace(/{content}/g,e);$pp_pic_holder.find("#pp_full_res")[0].innerHTML=toInject;g()});break;case"custom":a=w(movie_width,movie_height);toInject=settings.custom_markup;break;case"inline":myClone=e(pp_images[set_position]).clone().append('<br clear="all" />').css({width:settings.default_width}).wrapInner('<div id="pp_full_res"><div class="pp_inline"></div></div>').appendTo(e("body")).show();doresize=false;a=w(e(myClone).width(),e(myClone).height());doresize=true;e(myClone).remove();toInject=settings.inline_markup.replace(/{content}/g,e(pp_images[set_position]).html());break}if(!imgPreloader&&!skipInjection){$pp_pic_holder.find("#pp_full_res")[0].innerHTML=toInject;g()}});return false};e.prettyPhoto.changePage=function(t){currentGalleryPage=0;if(t=="previous"){set_position--;if(set_position<0)set_position=e(pp_images).size()-1}else if(t=="next"){set_position++;if(set_position>e(pp_images).size()-1)set_position=0}else{set_position=t}rel_index=set_position;if(!doresize)doresize=true;if(settings.allow_expand){e(".pp_contract").removeClass("pp_contract").addClass("pp_expand")}y(function(){e.prettyPhoto.open()})};e.prettyPhoto.changeGalleryPage=function(e){if(e=="next"){currentGalleryPage++;if(currentGalleryPage>totalPage)currentGalleryPage=0}else if(e=="previous"){currentGalleryPage--;if(currentGalleryPage<0)currentGalleryPage=totalPage}else{currentGalleryPage=e}slide_speed=e=="next"||e=="previous"?settings.animation_speed:0;slide_to=currentGalleryPage*itemsPerPage*itemWidth;$pp_gallery.find("ul").animate({left:-slide_to},slide_speed)};e.prettyPhoto.startSlideshow=function(){if(typeof m=="undefined"){$pp_pic_holder.find(".pp_play").unbind("click").removeClass("pp_play").addClass("pp_pause").click(function(){e.prettyPhoto.stopSlideshow();return false});m=setInterval(e.prettyPhoto.startSlideshow,settings.slideshow)}else{e.prettyPhoto.changePage("next")}};e.prettyPhoto.stopSlideshow=function(){$pp_pic_holder.find(".pp_pause").unbind("click").removeClass("pp_pause").addClass("pp_play").click(function(){e.prettyPhoto.startSlideshow();return false});clearInterval(m);m=undefined};e.prettyPhoto.close=function(){if($pp_overlay.is(":animated"))return;e.prettyPhoto.stopSlideshow();$pp_pic_holder.stop().find("object,embed").css("visibility","hidden");e("div.pp_pic_holder,div.ppt,.pp_fade").fadeOut(settings.animation_speed,function(){e(this).remove()});$pp_overlay.fadeOut(settings.animation_speed,function(){if(settings.hideflash)e("object,embed,iframe[src*=youtube],iframe[src*=vimeo]").css("visibility","visible");e(this).remove();e(window).unbind("scroll.prettyphoto");r();settings.callback();doresize=true;f=false;delete settings})};if(!pp_alreadyInitialized&&t()){pp_alreadyInitialized=true;hashIndex=t();hashRel=hashIndex;hashIndex=hashIndex.substring(hashIndex.indexOf("/")+1,hashIndex.length-1);hashRel=hashRel.substring(0,hashRel.indexOf("/"));setTimeout(function(){e("a["+s.hook+"^='"+hashRel+"']:eq("+hashIndex+")").trigger("click")},50)}return this.unbind("click.prettyphoto").bind("click.prettyphoto",e.prettyPhoto.initialize)};})(jQuery);var pp_alreadyInitialized=false

// the sho hide

$(document).ready(function(){

	// IE6 background image flicker fix
	try {
		document.execCommand("BackgroundImageCache", false, true);
	} catch(e) {}

	$('li.headlink').hover(
				function() { $('ul', this).css('display', 'block'); },
				function() { $('ul', this).css('display', 'none'); });		
		
	$(function() {
		$("#tabs").tabs();
	});
	
	var	prev = null;
	
	$('.showhide').bind('click', null,function(event) {
		var	next = $(event.target).next();		
		next.toggle();				
		
		if (next.is(':visible') )
		{					
			$(event.target).removeClass('showhide');
			$(event.target).addClass('showhideopen');						
		}else
		{			
			$(event.target).removeClass('showhideopen');
			$(event.target).addClass('showhide');
			
		}
		
		
		return false;
	});
	
	var elements = $('.showhide');
	for( var i = 0; i < elements.length; i++ )
	{			
		ele = $(elements[i]);
		ele.next().hide();
	}

});