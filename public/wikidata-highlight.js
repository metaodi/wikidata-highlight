// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.swissinfo.ch/eng/*
// @grant        none
// ==/UserScript==

function loadError(oError) {
  throw new URIError("The script " + oError.target.src + " didn't load correctly.");
}

function loadScript(url, onloadFunction) {
  var newScript = document.createElement("script");
  newScript.onerror = loadError;
  if (onloadFunction) { newScript.onload = onloadFunction; }
  document.head.appendChild(newScript);
  newScript.src = url;
}

function markTerm(term, label, content) {
    var markInstance = new Mark(document.querySelector("#mainArticle"));
    var unique = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    markInstance.mark(term, {
        className: 'mark-swissadvisor mark-swissadvisor-' + unique,
        separateWordSearch: false
    });
    var refs = document.querySelectorAll('.mark-swissadvisor-' + unique);
    refs.forEach(function(ref) {
        ref.setAttribute("data-toggle", "tooltip");
        ref.setAttribute('data-content', '<p style="font-weight: bold; color: white; font-size: 1.5rem;  text-transform: none;">' + label + '</p><p style="font-weight: normal; text-transform: none; color: white; font-size: .9375rem;">' + content + '</p>');
    });
}

(function($) {
    'use strict';

    console.log("test");

    loadScript("https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js", function() {
        // get all terms
        console.log("wikihighlight");
        var swiPath = window.location.pathname.replace('/^\/swissinfo/, '');
        $.get( "http://swiss-highlight.herokuapp.com/wikidata-highlight", { url: 'https://www.swissinfo.ch' + swiPath } )
            .done(function( highlights ) {
               console.log(highlights);
               highlights.forEach(function(highlight) {
                   console.log(highlight);
                   if (highlight.data && highlight.data.description) {
                       markTerm(highlight.term, highlight.data.label, highlight.data.description);
                   }
               });
               loadScript("https://unpkg.com/popper.js/dist/umd/popper.min.js", function() {
                   loadScript("https://unpkg.com/tooltip.js/dist/umd/tooltip.min.js", function() {
                       $( '[data-toggle="tooltip"]' ).each(function() {
                           new Tooltip($(this), {
                               placement: 'bottom',
                               title: $(this).data('content'),
                               trigger: 'click hover',
                               html: true,
                           });
                       });
                   });
               });
        });
    });

})(jQuery);
