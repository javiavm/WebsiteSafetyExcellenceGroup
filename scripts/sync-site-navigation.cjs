// Sync the shared public navigation after editing public/partials/site-navigation.html.
const fs = require('fs');
const pages = ['index','about-us','careers','data-centers','industries','services','why-seg'];
const navigation = fs.readFileSync('public/partials/site-navigation.html', 'utf8').trimEnd();
const bounds = function bounds(s){const start=s.indexOf('<header id="header">');const mobile=s.indexOf('<div class="mobile-menu" id="mobileMenu">',start);if(start<0||mobile<0)throw Error('Navigation missing');let depth=0;const re=/<\/?div\b[^>]*>/g;re.lastIndex=mobile;let m;while((m=re.exec(s))){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return [start,re.lastIndex];}throw Error('Unclosed mobile menu');};
for (const page of pages) {
 const file = 'public/' + page + '.html';
 let html = fs.readFileSync(file, 'utf8');
 const [start, end] = bounds(html);
 html = html.slice(0, start) + navigation + html.slice(end);
 html = html.replace(/\s*<link[^>]*href="(?:\/)?css\/header-nav.css"[^>]*>/g, '');
 html = html.replace('</head>', '    <link rel="stylesheet" href="/css/header-nav.css">\n</head>');
 html = html.replace(/\s*<script src="(?:\/)?js\/header-nav.js"><\/script>/g, '');
 html = html.replace(/<\/body>(\s*<\/html>\s*)$/, '    <script src="/js/header-nav.js"></script>\n</body>$1');
 fs.writeFileSync(file, html);
}
console.log('Shared navigation updated on ' + pages.length + ' pages.');
