jQuery(document).ready(function($) {

	// the top mini cart open and close

var minicart = $('.mini-cart-info').hide();
var openme = $('.cart');
openme.click(function(){
minicart.slideDown();
openme.mouseleave(function(){
minicart.slideUp();
});
});




   // The  sub menu open close

$('li.item ul').each(function(index) {
$(this).prev().addClass('idCatSubcat')});
$('li.item a').after('<span></span>');
$('li.item ul').css('display','none');
$('li.item ul.active').css('display','block');
$('li.item ul').each(function(index) {
$(this).prev().addClass('open-close').click(function() {
if (
$(this).next().css('display') == 'none') {
$(this).next().slideDown(400, function () {
$(this).prev().removeClass('collapsed').addClass('expanded');
});
}else {
$(this).next().slideUp(400, function () {
$(this).prev().removeClass('expanded').addClass('collapsed');
$(this).find('ul').each(function() {
$(this).hide().prev().removeClass('expanded').addClass('collapsed');
});
});
}
return false;
});
});




// The scrolling to top

$(window).scroll(function () {
if ($(this).scrollTop() > 100) {
$('.scroll-to-top').fadeIn();
} else {
$('.scroll-to-top').fadeOut();
}
});

$('.scroll-to-top').click(function () {
$('body,html').animate({
scrollTop: 0
}, 800);
return false;
});




// The quick view

 $("a.colorbox").colorbox({
rel: 'colorbox',
inline:true,
html: true,
width:'58%',
maxWidth:'780px',
height:'70%',
opacity:0.6,
open:false,
returnFocus:false,
fixed: false,
arrowKey:	true,
title: false,
current:'Товар {current} из {total}'
});


// The animation fly to cart


$('.addToCart').click(function () {
var cart = $('.cart');
var imgtodrag = $(this).closest('.itembox').find("img");
var imgclone = imgtodrag.clone()
.offset({
top: imgtodrag.offset().top,
left: imgtodrag.offset().left
})
.css({
'opacity': '0.5',
'position': 'absolute',
'height': '150px',
'width': '150px',
'z-index': '100'
})

.appendTo($('body'))
.animate({
'top': cart.offset().top + 10,
'left': cart.offset().left + 10,
'width': 75,
'height': 75
},1000);

imgclone.animate({
'width': 0,
'height': 0
});
});



//  the images in product page


    jQuery('#mycarousel').jcarousel({
        // Configuration goes here
    });

    jQuery('#related').jcarousel({
        // Configuration goes here
    });




// the tabs

$('.tabs a').click(function(){
$(this).addClass('selected').siblings().removeClass('selected');
var activetab = $(this).attr('href');
var tabs = $('.tab-content >div').hide();
$('#'+activetab).fadeIn();
return false;
});


//the grid list switcher

$(function() {
$('.product-list-wrapper').addClass('grid');
var cc = $.cookie('list_grid');
if (cc == 'g') {
$('.product-list-wrapper').addClass('grid');
$('#grid').addClass('active').siblings().removeClass('active');
} else {
$('.product-list-wrapper').removeClass('grid');
}
});

$('.display a').click(function(){
$(this).addClass('active').siblings().removeClass('active');
return false;
});


$('#grid').click(function() {
$('.product-list-wrapper').fadeOut(300, function() {
$(this).addClass('grid').fadeIn(300);
$.cookie('list_grid', 'g', {expires: 7});
});
return false;
});


$('#list').click(function() {
$('.product-list-wrapper').fadeOut(300, function() {
$(this).removeClass('grid').fadeIn(300);
$.cookie('list_grid', null);
});
return false;
});


    //the slide show in product

$("area[data-rel^='prettyPhoto']").prettyPhoto();

$(".gallery:first a[rel^='prettyPhoto']").prettyPhoto({animation_speed:'normal',slideshow:3000, autoplay_slideshow: false});
$(".gallery:gt(0) a[rel^='prettyPhoto']").prettyPhoto({animation_speed:'fast',slideshow:10000, hideflash: true});




// =====
});